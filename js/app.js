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
      try{
       navigator.serviceWorker.register(urlSw);
      }catch(e){}      
    }    
 
}

function setTriggers(){

  
  $("#form_registro .submit").click(function() {
    createUser();
  });

  $("#form_datos .submit").click(function() {
    updateUser();
  });

  $('#form_agregar').on('submit', function(e){
      e.preventDefault();      
  });
  
  let invalidChars = ["-", "e", "+", "E"];

  $("input[type='number']").on("keydown", function(e){ 
      if(invalidChars.includes(e.key)){
         e.preventDefault();
      }
  });

  $('.ui.big.basic.button').click(function() {
     $("#form_agregar input[name=phone]").val("");
     $('.ui.modal').modal('show');
  });
  
  $(".ui.positive").on("click", function(e){ 
     e.preventDefault();
     console.log("agregando amigo");
     optionMenu(0);
  });

}
  
function optionMenu(num){
    
    $('#initloading').hide(); 
    $('.ui.modal').modal('hide'); 
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
        loadContacts(false);
        break;

      case 5:
        $('#contagiados').show();
        loadContacts(true);
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
     }else{
        optionMenu(1);
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
 
     if(validateNewUserData()){
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
        fetchUrlGet('users',user.phoneNumber);
        optionMenu(0);  

    }

}

async function updateUser(){

  if( validateUserData() ){

      let covidDate = new Date();  
      
      if( !$("#form_datos input[name=covid]").prop('checked') ){
          covidDate = null;      
      }else{  
        if( user.covidDate != null){
          covidDate = user.covidDate;
        }else{
          covidDate = covidDate.toISOString().split('T')[0] + ' ' + covidDate.toTimeString().split(' ')[0];
        }

      }

      await db.users.update(user.phoneNumber,{
          name: $("#form_datos input[name=name]").val(),
          lastName: $("#form_datos input[name=last_name]").val(),
          covidDate: covidDate
        });
      user = await db.users.limit(1).first();
      optionMenu(0);     
  }

}

function loadContacts(covid){

  if(user === undefined){
    optionMenu(1);
  }

}

function validateNewUserData(){
      
      $('.field').removeClass('error');
      let name      =  $("#form_registro input[name=name]").val();
      let last_name =  $("#form_registro input[name=last_name]").val();
      let phone     =  $("#form_registro input[name=phone]").val();
      let vreturn   =  true;
      
      if( name.length <= 2){
        $("#form_registro input[name=name]").parent().parent().addClass('error');
        vreturn = false;
      }

      if(last_name.length <= 2){
        $("#form_registro input[name=last_name]").parent().parent().addClass('error');
        vreturn = false;
      }  

      if(phone.length != 10 ){            
        $("#form_registro input[name=phone]").parent().parent().addClass('error');        
        vreturn = false;
      } 
    
  return vreturn;
}

function validateUserData(){
      
      $('.field').removeClass('error');
      let name      =  $("#form_datos input[name=name]").val();
      let last_name =  $("#form_datos input[name=last_name]").val();
      let phone     =  $("#form_datos input[name=phone]").val();
      let vreturn   =  true;
      
      if( name.length <= 2){
        $("#form_datos input[name=name]").parent().parent().addClass('error');
        vreturn = false;
      }

      if(last_name.length <= 2){
        $("#form_datos input[name=last_name]").parent().parent().addClass('error');
        vreturn = false;
      }  

      if(phone.length != 10 ){            
        $("#form_datos input[name=phone]").parent().parent().addClass('error');        
        vreturn = false;
      } 
    
  return vreturn;
}

async function fetchUrlGet(base,param){

  let url = `https://arcovid.herokuapp.com/v1/${base}/${param}`;
  console.log("url",url);

  let h = new Headers();
  h.append('Accept','aplication/json');
  h.append('Access-Control-Allow-Origin','*');

  let req = new Request(url, {
                method: 'GET',
                headers: h,
                mode: 'cors'
  });

  await fetch(req)
  .then(response => response.json())
  .then(data => console.log("data",data));

}