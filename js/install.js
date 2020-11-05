var deferredPrompt;

window.onload = function() {

    initialView();
    
    setListeners();

    setServiceWorker();   

}

function initialView(){

    let d       = detect.parse(navigator.userAgent);
    let browser = d.browser.name;
    let device  = d.device.type;
    let agent   = navigator.userAgent;
    
    if(agent.indexOf('Samsung') > -1 || browser.indexOf('Chrome') < 0 || device != 'Mobile'){
      $( "#install" ).remove();
      $( "#initloading" ).show();
      setTimeout(function(){
          $( "#initloading" ).remove();
          $( "#chromemessage" ).show();
      }, 5000);
    }else{
      $( "#chromemessage" ).remove();
      $( "#initloading" ).show();
      setTimeout(function(){ 
          $( "#install" ).show();
      }, 5000);
    }

}

function setListeners(){
    
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  const buttonAdd = document.getElementById('install');
  
  if(buttonAdd != null){

    buttonAdd.addEventListener('click', (e) => {

      deferredPrompt.prompt();
         
      deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {                  
               installedApp();
            }
            deferredPrompt = null;
        });
      });

  }

    window.addEventListener('appinstalled', (evt) => {
      installedApp();
    });

}

function setServiceWorker(){

    var urlSw = 'sw.js'; 
         
    if(navigator.serviceWorker){

       navigator.serviceWorker.register(urlSw);
    }

}

function installedApp(){
   $("#install").remove();   
   $("#chromemessage").remove();
   $("#installed").show();
}