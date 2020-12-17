/* app v1.0.0 */
var user;
var db;
var currentOption;
var registration;
var subscriptionKey;
var subscription;

window.onload = function() {
    init();    
    setServiceWorker();    
    setTriggers();
    validateNotifications();
}

function init(){

    const url_string = window.location.href;
    const urlv = new URL(url_string);
    let u = urlv.searchParams.get("source");
    const mobMode = (u === 'pwa' && (window.matchMedia('(display-mode: standalone)').matches ? true : false) );
    
    if( !mobMode ){
       window.location.href = 'error.html';   
    }

    $('.ui.checkbox').checkbox();    
    optionMenu(0);    
    syncFriends();
    
}

function setServiceWorker(){

    let urlSw = 'sw.js';
         
    if(navigator.serviceWorker){
      try{
        navigator.serviceWorker.register(urlSw).then( reg =>{
        registration = reg;        
       }); 
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
     $('.ui.modal').modal({autofocus: false}).modal('show');
  });
  
  $(".ui.positive").on("click", function(e){ 
     addFriend();
     e.preventDefault();        
  });

  $("#form_datos input[name=notification]").change(function(){


    if( $("#form_datos input[name=notification]").prop('checked') ){

        Notification.requestPermission( function( permission ){
            if( permission === 'granted'){
                $("#form_datos input[name=notification]").prop('checked', true);
                registerSubscription();           
            }else{
                $("#form_datos input[name=notification]").prop('checked', false);
            }
        });
    }

  });

  $("#form_datos input[name=covid]").change(function(){
    updateUser();    
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
    currentOption = num;

    switch (num) {
      case 0:
        $('#initloading').show();
        setTimeout(async function(){
          await intialvalidation();
          updateFriendsInfo();            
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
  db.version(1).stores({friends: "phoneNumber,name,lastName,covidDate"});
  db.version(1).stores({infected: "phoneNumber,name,lastName,covidDate,status"});
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
 
     if( await validateNewUserData() ){
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
        let userRequest = {
            "userPhoneNumber": user.phoneNumber,
            "userName": user.name,
            "userLastName": user.lastName,
            "userHealthState": null,
            "userCovidDate": covidDate
        };

        fetchUrlPost('users','add',userRequest);      
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
      user = await db.users.limit(1).first().then( user => updateUserRomte(user) );
      optionMenu(0);
  }

}

function loadContacts(covid){

  if(user === undefined){
    optionMenu(1);
    return false;
  }

  if(!covid){
    loadFriends();
  }else{
    loadInfectedFriends();
  }



}

function validateNewUserData(){
           

      $('.field').removeClass('error');
      let name      =  $("#form_registro input[name=name]").val();
      let last_name =  $("#form_registro input[name=last_name]").val();
      let phone     =  $("#form_registro input[name=phone]").val();
      let vreturn   =  true;


      return fetchUrlGet('users', phone).then(function(user){
        
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
        
        if( user.length > 0 ){      
          $("#form_registro input[name=phone]").parent().parent().addClass('error');        
          vreturn = false;
        }

        return vreturn;      

      });
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

function fetchUrlGet(base,param){

  var promesa = new Promise( function(resolve, reject){

        try{

          let url = `https://arcovid.herokuapp.com/v1/${base}/${param}`;  
          fetch(url)
          .then(response => response.json())
          .then(data => {
            resolve( (data.length > 0)?data:false );          
          }); 

        }catch(e){}     
  
  });

  return promesa;
  
}


function fetchUrlPost(base,action,param){

  var promesa = new Promise( function(resolve, reject){

        try{

        let result = fetch(`https://arcovid.herokuapp.com/v1/${base}/${action}`,
                    {
                          method: 'POST',
                          mode: 'cors',
                          cache: 'no-cache',    
                          headers: {
                            'Content-Type': 'application/json'      
                          },
                          redirect: 'follow',
                          referrerPolicy: 'no-referrer',
                          body: JSON.stringify(param)             
                    })
                    .then(response => response.json())
                    .then(data => {
                      resolve( (data.length > 0)?data:false );          
                    });
        
        }catch(e){}

  });

  return promesa;
  
}

function addFriend(){

   let phone = $("#form_agregar input[name=phone]").val();
   
   fetchUrlGet('users', phone).then(function(friend){
      
      if( friend.length > 0 ){
        
        let covidDate = new Date();  
        friend = friend[0];
        
        if( friend.userCovidDate != null && friend.userCovidDate !== undefined ){          
          covidDate = (((friend.userCovidDate).replace(/T/gi, " ")).replace(/Z/gi, "")).substring(0,19);
        }else{
          covidDate = null;
        }

        db.friends.add({
                phoneNumber: friend.userPhoneNumber,
                name: friend.userName,
                lastName: friend.userLastName,
                covidDate: covidDate
        })
        .then( () => loadFriends() );

        if(covidDate!== null){
            db.infected.add({
                  phoneNumber: friend.userPhoneNumber,
                  name: friend.userName,
                  lastName: friend.userLastName,
                  covidDate: covidDate,
                  status: 1
            });
        }       
    
      }else{
        console.log("no se encontro el contacto");
      }
  });

}

function loadFriends(){
  $("#lista_contactos").html("");
  db.friends.toArray().then( function(friends){
    if( friends !== undefined && friends.length > 0 ){
      
      friends.forEach(function(friend){
        addFriendToList(friend);
      });
      $(".card").css("width", "100%");
    }else{
      $("#lista_contactos").html("No tenes contactos cargados.");
    }
  });  
}


function addFriendToList(friend){

  const colors = ['red','green','blue','grey','pink','yellow','black'];
  const random = Math.floor(Math.random() * colors.length);

  if(friend.covidDate != null && friend.covidDate !== undefined){
    
    $("#lista_contactos").append(`            
            <a class="item">
              <div class="ui red card">
                <div class="content">
                  <a class="ui red right corner label" onclick="deleteFriend(${friend.phoneNumber})">
                    <i class="trash alternate outline icon"></i>
                  </a>
                  <div class="header">${friend.name} ${friend.lastName}</div>
                  <div class="meta">
                    <span class="category"><i class="medkit red icon"></i> ${friend.covidDate}</span>
                  </div>
                </div>
              </div>
            </a>          
    `);        

  }else{
    
    $("#lista_contactos").append(`            
            <a class="item">
              <div class="ui grey card">
                <div class="content">
                  <a class="ui blue right corner label" onclick="deleteFriend(${friend.phoneNumber})">
                    <i class="trash alternate outline icon"></i>
                  </a>
                  <div class="header">${friend.name} ${friend.lastName}</div>                
                </div>
              </div>
            </a>          
    `);

  }

}


function loadInfectedFriends(){
  $("#lista_contactos_contagiados").html("");
  db.friends.where('covidDate').notEqual('').toArray().then( function(friends){
    if( friends !== undefined && friends.length > 0 ){
      
      friends.forEach(function(friend){
        addFriendToInfectedList(friend);
      });
      $(".card").css("width", "100%");
    }else{
      $("#lista_contactos_contagiados").html("No tenes contactos contagiados.");
    }
  });  
}

function addFriendToInfectedList(friend){

  const colors = ['red','green','blue','grey','pink','yellow','black'];
  const random = Math.floor(Math.random() * colors.length);

  if(friend.covidDate != null && friend.covidDate !== undefined){
    
    $("#lista_contactos_contagiados").append(`            
            <a class="item">
              <div class="ui red card">
                <div class="content">
                  <a class="ui red right corner label" onclick="deleteFriend(${friend.phoneNumber})">
                    <i class="trash alternate outline icon"></i>
                  </a>
                  <div class="header">${friend.name} ${friend.lastName}</div>
                  <div class="meta">
                    <span class="category"><i class="medkit red icon"></i> ${friend.covidDate}</span>
                  </div>
                </div>
              </div>
            </a>          
    `);      

  }

}

function updateFriendsInfo(){
  let friendsId = [];
  
  db.friends.toArray().then( function(friends){
    if( friends !== undefined && friends.length > 0 ){      
      friends.forEach(function(friend){
        friendsId.push(friend.phoneNumber);
      });

      fetchUrlPost('users','bulk',friendsId).then(bulk => {
          
          if(bulk.length > 0 ){
              bulk.forEach(function(friend){
                   
                  let covidDate = null;  
                  
                  if( friend.userCovidDate != null && friend.userCovidDate !== undefined ){          
                    covidDate = (((friend.userCovidDate).replace(/T/gi, " ")).replace(/Z/gi, "")).substring(0,19);
                  }
                  db.friends.put({
                        phoneNumber: friend.userPhoneNumber,
                        name: friend.userName,
                        lastName: friend.userLastName,
                        covidDate: covidDate
                  }).then( () => {
                       
                    db.infected.where("phoneNumber").equals(friend.userPhoneNumber).count().then( function(count){                        
                      if( count <= 0 && covidDate !== null){                          
                          db.infected.put({
                            phoneNumber: friend.userPhoneNumber,
                            name: friend.userName,
                            lastName: friend.userLastName,
                            covidDate: covidDate,
                            status: 0
                          });
                      }else if( count > 0 && covidDate === null){
                          db.infected.delete( (friend.userPhoneNumber).toString() );
                      }
                    });

                  });

              });  
          }
        
      }).then( () => { 
         //showNotification();
         syncFriends();
         optionMenu(currentOption);
      }); 
    }else{
      syncFriends();      
    }
  });
}

async function updateUserRomte(user){

  let userRequest = {
            "userPhoneNumber": user.phoneNumber,
            "userName": user.name,
            "userLastName": user.lastName,
            "userHealthState": null,
            "userCovidDate": user.covidDate,
            "userRegistryDate":null
  };

  await fetchUrlPost('users','update',userRequest);
  fetchUrlPost('push','push',[]);
}

function syncFriends(){

  setTimeout(function(){
      updateFriendsInfo();             
  }, 60000 );

}

function deleteFriend(friendId){
  
  db.infected.delete( friendId.toString() );  
  db.friends.delete( friendId.toString() ).then( () => loadFriends() );  
  
}

function validateNotifications(){

  if( !window.Notification ){
    $("#form_datos input[name=notification]").parent().parent().parent().remove();
    return false;
  }

  if( Notification.permission === 'denied' ){
    $("#form_datos input[name=notification]").prop('checked', false);
    return 'denied';
  }

  if( Notification.permission === 'granted' ){
    $("#form_datos input[name=notification]").prop('checked', true);
    return 'granted';
  }  

  if( Notification.permission === 'default' ){
    $("#form_datos input[name=notification]").prop('checked', false);    
    return 'default';
  }

}

function showNotification(){

  db.infected.where("status").equals(0).count().then( function(count){
    if(count>0){
      
      let title = 'Covid19 App';
      let options = {
          lang: 'ES',
          body: 'Hay nuevos contactos contagiados',
          icon: 'img/icons/logo-32.png',
          image: 'img/icons/logo-32.png',
          silent: false,
          requireInteraction: true
      };      
      
      Push.create(title,options).then( () => {
        db.infected.where("status").equals(0).modify({status: 1});
      });
    }
  });

}

function registerSubscription(){

  fetch('https://arcovid.herokuapp.com/v1/push/key',{
  
                          method: 'POST',
                          mode: 'cors',
                          cache: 'no-cache',    
                          headers: {
                            'Content-Type': 'application/json'      
                          },
                          redirect: 'follow',
                          referrerPolicy: 'no-referrer'                                       
  })
  .then( resKey => resKey.arrayBuffer())
  .then( key => {

          subscriptionKey = new Uint8Array(key);
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: subscriptionKey
          })
          .then( subs => { 
                fetch('https://arcovid.herokuapp.com/v1/push/subscribe',{                
                       method: 'POST',
                       body: JSON.stringify(subs),
                       mode: 'cors',
                       cache: 'no-cache',    
                       headers: {
                         'Content-Type': 'application/json'      
                       },
                       redirect: 'follow',
                       referrerPolicy: 'no-referrer'
                });
          });        
  });

}