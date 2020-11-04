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
    
    if( agent.indexOf('Samsung') > -1 || browser.indexOf('Chrome') < 0 || device != 'Mobile' ){
      $( "#install" ).remove();
    }else{
      $( "#chromemessage" ).remove();
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
               alert('instalada choice');
            }
            deferredPrompt = null;
        });
      });

  }

    window.addEventListener('appinstalled', (evt) => {
      alert('instalada installed');
    });

}

function setServiceWorker(){

    var urlSw = 'sw.js'; 
         
    if(navigator.serviceWorker){

       navigator.serviceWorker.register(urlSw);
    }

}

function installedApp(){
   $( "#install" ).remove();   
   $( "#chromemessage" ).remove();
   $( "#installed" ).show();
}