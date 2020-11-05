
window.onload = function() {

    init();    
    setServiceWorker();

}


function init(){

    $('.ui.checkbox').checkbox();

}

function setServiceWorker(){

    var urlSw = 'sw.js';
         
    if(navigator.serviceWorker){

       navigator.serviceWorker.register(urlSw);
    }

}
  
function optionMenu(num){

    $('#registro').hide();  
    $('#inicio').hide();
    $('#datos').hide();
    $('#contactos').hide();
    $('#contagiados').hide();

    switch (num) {
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


