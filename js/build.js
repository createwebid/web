// const inputFrame = byId("input-frame");
      const inputPhoto = byId("input-photo");
      const previewPhoto = byId("preview-photo");
      const resultPreview = byId("result-preview");

      
      const inputText = byId("custom-text");
      const textModifiers = document.getElementsByClassName("text-modifier");
      
      let previewFrame = byId("preview-frame");
      let selectFrameCategory= byId("frame-category"); 
      let frameList = byId("frame-list"); 

      const downloadButton = byId("downloadButton");
      const downloadLink = byId("downloadLink");

      let photoImageData = null;
      let frameImageData = null;
      let imageIsCentered = false;

      //canvas
      const canvas = byId("canvas");
      const tempCanvas = byId("temp-canvas");
      const tempFrameCanvas = byId("temp-frame-canvas");

      const ctx = canvas.getContext("2d");
      const tempCtx = tempCanvas.getContext("2d");
      const tempFrameCtx = tempFrameCanvas.getContext("2d");

      function init() {
        previewFrame = byId("preview-frame");
        selectFrameCategory = byId("frame-category"); 
        frameList = byId("frame-list"); 

        fillPreviewAttrs(previewFrame);
        fillPreviewAttrs(previewPhoto);

        byId("btn-set-photo").onclick = function (e) {
          byId("preview-photo-name").innerHTML = inputPhoto.files[0].name;
          toBase64v2(inputPhoto).then(function (result) {
            previewPhoto.src = result;
            photoImageData = result;
          }).catch(function(e){  alert("invalid file"); });
        };
        
        byId("btn-process").onclick = function (e) {
          imageIsCentered = true;
          processPhoto();
        };

        downloadButton.onclick = function (e) {
            confirmDialog("Download Result?").then(function(confirmed){
              if(confirmed){  saveAsImage(); }
            });
        };

        initCanvasSize();
        initTextModifiersEvents();
        // setText();
        populateFrameCategoriesMenu().then(function(index){
          
          displayFrameLists(index);
        }).catch(function(e){console.error("ERROR populateFrameCategoriesMenu: ",e)});
      }
 

      function initCanvasSize(){
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        
        tempCanvas.width = WIDTH;
        tempCanvas.height = HEIGHT;

        resultPreview.width = WIDTH/SCALE;
        resultPreview.height = HEIGHT/SCALE;

        console.debug("canvas size initialized");
      }

      function initTextModifiersEvents(){
        for (let i = 0; i < textModifiers.length; i++) {
          const element = textModifiers[i];
          element.onchange = function(e){
            byId("out-"+element.id).innerHTML = element.value;
            processPhoto();
          }
          
          //set initial value
          if(element.getAttribute('initialValue')){
            element.value = element.getAttribute('initialValue');
          }
          byId("out-"+element.id).innerHTML = element.value;
        }
      }

      function saveAsImage() {
        const data = canvas.toDataURL("image/png");
        const fileName = "KafilaFrameResult_"+(new Date()).toISOString()+".png";
        downloadLink.href = data;
        downloadLink.download = fileName;
        try{
          
          downloadLink.click();
        }catch(e){
          console.warn(e);
          alert("Mohon Maaf Download Gagal. Silakan simpan gambar secara manual pada bagian preview"); 
          
        }
      }

      function processPhoto() {
        if (!frameImageData || !photoImageData) {
          alert("Photo and Frame must be choosen!");
          return;
        }

        //clear
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        //draw
        drawUserPhoto().then(function(){
          drawFrame().then(function(){
            stopLoading();
          });
          imageIsCentered = false;
        }).catch(function(e){alert("ERROR!")});
      }
     
      function drawUserPhoto() {
        startLoading();
        return new Promise(function(resolve, reject) {
          //User Photo
          const img = new Image();
          img.src = photoImageData;
          img.onload = function () {
            const dimensionRaw = caliberateImageSize(img);
            const dimension = updateCanvasDimension(tempCanvas, dimensionRaw);

            clearRect(tempCtx, dimensionRaw.width, dimensionRaw.height);
            tempCtx.drawImage(img, 0, 0, dimensionRaw.width, dimensionRaw.height);
            const newImg = new Image();
            newImg.src = tempCanvas.toDataURL();
            newImg.onload = function(){
              // console.debug("IMG SIZE: ", newImg.width ,"x", newImg.height);
              var imageX = 0, imageY = 0;
              const canvasX = 0, canvasY = 0;

              clearRect(ctx, WIDTH, HEIGHT);
              console.debug("imageIsCentered && dimension.adjustedSide: ", imageIsCentered , dimension.adjustedSide);
              if(imageIsCentered ){

                if( dimension.adjustedSide != null && dimension.adjustedSide == "w"){
                  imageX = ( dimension.width - WIDTH)/2;
                }else if( dimension.adjustedSide != null && dimension.adjustedSide == "h"){
                  imageY = (dimension.height - HEIGHT)/2;
                }else {
                  imageX = 0;
                  imageY = 0;
                }
                updateImageInputRange(imageX, imageY);
              } else {
                imageX = byId("image-x").value;
                imageY = byId("image-y").value;
              }          
              // The source newImg is taken from the coordinates (imageX, imageY), 
              // with a width of WIDTH and a height of HEIGHT. 
              // It is drawn to the canvas at (canvasX, canvasY),
              // where it is given a width of WIDTH and a height of HEIGHT.
              try{
                ctx.drawImage(newImg, imageX, imageY, WIDTH, HEIGHT, canvasX, canvasY, WIDTH, HEIGHT);
              }catch(e){
                console.debug("Error drawing: ", e);
              }
              resolve();
            }
          };
        });
      }

      function drawFrame() {
        return new Promise(function(resolve, reject){
          const frameImg = new Image();
          frameImg.onload = function () {
            ctx.drawImage(frameImg, 0, 0, WIDTH, HEIGHT);
            setText();
            resultPreview.src = canvas.toDataURL();
            resolve();
          };
          frameImg.src = frameImageData;
        });       
      }

      function setCenter(){
        imageIsCentered = true;
        processPhoto();
      }

      function updateCanvasDimension(canvas, dimension){
        canvas.width = dimension.width;
        canvas.height = dimension.height;

        if(imageIsCentered){
          byId("image-scale").value = 100;
          byId("out-image-scale").innerHTML = 100;
        }
        const imageScale = parseInt(byId("image-scale").value);
        
        dimension.width = dimension.width * (imageScale/100);
        dimension.height = dimension.height * (imageScale/100);

        return dimension;
      }

      function updateImageInputRange(imageX,imageY){
        byId("image-x").value = imageX;
        byId("image-y").value = imageY;
        byId("out-image-x").innerHTML = imageX;
        byId("out-image-y").innerHTML = imageY;
      }

      function setText() {
        return true; 
      }

      function fillPreviewAttrs(imgElement) {
        imgElement.width = 300;
        imgElement.height = 300;
       // imgElement.className = "img-thumbnail";
        imgElement.src = "#";
      }

      function displayFrameLists(frameCategoryIndex){
        frameList.innerHTML = "";
        var FRAME_IMAGES = GROUPED_FRAME_IMAGES[frameCategoryIndex].images;
        
        for (let i = 0; i < FRAME_IMAGES.length; i++) {
          const imageName = FRAME_IMAGES[i];
          const index = i;
          const listItem = createHtmlTag({
            tagName:'div', className:'col-6 border rounded',
            ch1:{
              tagName:'div',
              className:'clickable',
              style:{'text-align':'center'},
              id: imageName,
              onclick: function(e){
                frameOptionOnChange((index+1), imageName);
              }, 
              ch0: {
                tagName:'img',
                id: 'img-'+imageName,
                src:'../assets/templates/'+imageName,
                style:{'background-color':'#cccccc'},
                alt: imageName,   
                class:"img-thumbnail",
                onload: function(e){
                   
                  byId("label-option-"+index).innerHTML = "Option "+(index+1)
                }
              },
              ch1: {
                id:"label-option-"+index,
                tagName:'label',
                innerHTML: "Loading..."
              }
            }
          });
         
          frameList.appendChild(listItem);
        }
      }

      function frameOptionOnChange(index, imageName){ 
        const img = byId('img-'+imageName);
        const tempImage = new Image();
        tempImage.src = img.src;
        byId("preview-frame-name").innerHTML = "Option "+index+" ("+ imageName +")";
        
        tempImage.onload = function(e){

          tempFrameCanvas.width = tempImage.width;
          tempFrameCanvas.height = tempImage.height;

          tempFrameCtx.drawImage(tempImage,0,0,WIDTH,HEIGHT);
          frameImageData = tempFrameCanvas.toDataURL();

          console.debug(imageName," Frame size: ", tempImage.width,"x", tempImage.height);
        }
        previewFrame.src = img.src; 
      }

      function startLoading(){
        byId("loading").innerHTML = "<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span><span>Loading...</span>";
      }

      function stopLoading(){
        byId("loading").innerHTML = "";
      }
      includeHTML(byId("frame-selection-wrapper")).then(function(){
        init();
      }).catch(function(e){console.error("ERROR", e)});
