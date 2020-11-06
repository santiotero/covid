var user;
var db;

window.onload = function() {
    init();    
    setServiceWorker();    
    setTriggers();
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

function setTriggers(){

  $("#form_registro .submit").click(function() {
    createUser();
  });

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
          intialvalidation();  
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
        loadUser();
        break;

      case 4:
        $('#contactos').show();
        loadContacts();
        break;

      case 5:
        $('#contagiados').show();
        loadCovidContacts();
        break;

      default:        
        break;
    }

}



async function intialvalidation(){

  db = new Dexie('covid_db');
  db.version(1).stores({users: "phoneNumber,name,lastName,covidDate"});
  if (!(await Dexie.exists(db.name))) {    
    optionMenu(1);    
  }else{
     await db.open();        
     let count = await db.users.count();
     if(count == 1){
        user = await db.users.limit(1).first();
        optionMenu(4);
        loadUser();
     }        
  }
}


function loadUser(){
  
  if(user !== undefined){ 
    $("#form_datos input[name=name]").val(user.name);
    $("#form_datos input[name=last_name]").val(user.lastName);
    $("#form_datos input[name=phone]").val(user.phoneNumber);
    if(user.covidDate != null){
      $("#form_datos input[name=covid]").prop('checked', true);
    }
  }else{
    optionMenu(1);
  }

}

async function createUser(){

  let covidDate = new Date();  
  
  if( $("#form_registro input[name=covid]").prop('checked') ){
    covidDate = covidDate.toISOString().split('T')[0] + ' ' + covidDate.toTimeString().split(' ')[0];
  }else{
    covidDate = null;
  }

  await db.users.add({
          phoneNumber: $("#form_registro input[name=phone]").val(),
          name: $("#form_registro input[name=name]").val(),
          lastName: $("#form_registro input[name=last_name]").val(),
          covidDate: covidDate
  });
  user = await db.users.limit(1).first();

}

function loadContacts(){

  if(user !== undefined){ 
    
  }else{
    optionMenu(1);
  }
}

function loadCovidContacts(){

  if(user !== undefined){ 
    
  }else{
    optionMenu(1);
  }
}

 
