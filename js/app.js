var appUser;

window.onload = function() {

    init();    
    setServiceWorker();

}


function init(){

    $('.ui.checkbox').checkbox();
    optionMenu(0);

}

function setServiceWorker(){

    let urlSw = 'sw.js';
         
    if(navigator.serviceWorker){

       navigator.serviceWorker.register(urlSw);
    }

}
  
function optionMenu(num){

    $('#initloading').hide();
    $('#registro').hide();  
    $('#inicio').hide();
    $('#datos').hide();
    $('#contactos').hide();
    $('#contagiados').hide();

    switch (num) {
      case 0:
        $('#initloading').show();
        setTimeout(function(){
          validateUser();  
        }, 2000);
        break;

      case 1:
        $('#registro').show();
        break;

      case 2:
        $('#inicio').show();
        break; 

      case 3:
        $('#datos').show();
        break;

      case 4:
        $('#contactos').show();
        break;

      case 5:
        $('#contagiados').show();
        break;

      default:        
        break;
    }

}

function validateUser(){

  if(appUser == {} || appUser == null || !appUser){
    optionMenu(1);
  }else{
    optionMenu(3);
  }

}


