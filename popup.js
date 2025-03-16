document.getElementById("downloadBtn").addEventListener("click", async function() {
  const statusDiv = document.getElementById("status");
  statusDiv.innerText = "Starting download...";
  const images = [];
  let page = 1;
  //Another option for the url is large instead of page. Also there is thumb
  const baseUrl = "https://www.haaretz.co.il/st/inter/Global/dailyedition/today/files/page/";

  while (true) {
    const url = baseUrl + page + ".jpg";
    statusDiv.innerText = "Downloading: " + url;
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        statusDiv.innerText = "No more images found at page " + page;
        break;
      }
      const blob = await response.blob();
      // Convert blob to Data URL using a temporary Image and canvas
      const imgDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = function() {
          reject("Error loading image.");
        };
        img.src = URL.createObjectURL(blob);
      });

      // Load the image to get dimensions
      const tempImg = new Image();
      tempImg.src = imgDataUrl;
      await new Promise((res, rej) => {
        tempImg.onload = res;
        tempImg.onerror = rej;
      });

      images.push({ dataUrl: imgDataUrl, width: tempImg.width, height: tempImg.height });
    } catch (error) {
      console.error(error);
      statusDiv.innerText = "Error on page " + page + ": " + error;
      break;
    }
    page++;
  }

  if (images.length === 0) {
    statusDiv.innerText = "No images downloaded.";
    return;
  }

  statusDiv.innerText = "Converting images to PDF...";

  // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [images[0].width, images[0].height]  // Initialize with the first image dimensions
    });

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (i > 0) {
            doc.addPage([img.width, img.height]);  // Use each image’s dimensions for the page size
        }

        // Add image to the page
        doc.addImage(img.dataUrl, "JPEG", 0, 0, img.width, img.height);
    }

  /************SAVE AS A4************** const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (i > 0) {
      doc.addPage();
    }

    // Calculate dimensions to fit the page while keeping aspect ratio.
    const imgRatio = img.width / img.height;
    let imgWidth = pageWidth;
    let imgHeight = pageWidth / imgRatio;
    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      imgWidth = pageHeight * imgRatio;
    }
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    doc.addImage(img.dataUrl, "JPEG", x, y, imgWidth, imgHeight);
  }
*************************************/


  // Save the PDF file
  doc.save("daily_edition.pdf");
  statusDiv.innerText = "PDF created and downloaded!";
});
