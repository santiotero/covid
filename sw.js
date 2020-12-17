/*   Sw 1.0   */
var db;
var idb;
var transaction;
var objectStore;
var request;
var friendsId  = [];		
var response;
var title = 'Covid19 App';
var options = {
          lang: 'ES',
          body: 'Hay nuevos contactos contagiados',
          icon: 'img/icons/logo-32.png',          
          silent: false,
          requireInteraction: true
};
var notify = false;


const updateFriends = function(fetchUrlPost, friendsId){
	if(friendsId.length <= 0){		
		return;
	}
	
	fetchUrlPost('users','bulk',friendsId).then(bulk => {		  		
		  		if(bulk.length > 0 ){
			  		notify = false;
			  		bulk.forEach(function(friend){			  			
			  			if( friend.userCovidDate != null && friend.userCovidDate !== undefined ){
			  				notify = true;
			  			}
		  			});		  			
		  			if(notify){		  			   
		  			   self.registration.showNotification(title, options);
		  			   console.log("service worker notify ok");			  			   
		  			} 
		  			notify = false;
		  		}		  		
	});
	
}


const fetchUrlPost = function (base,action,param){

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


self.addEventListener("fetch", function(event){
	console.log("service worker fetch");
});

self.addEventListener("push", function(event){
	console.log("service worker push");	
	initSync(updateFriends, fetchUrlPost);
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click';  
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );

});


function initSync(updateFriends, fetchUrlPost){

	idb = indexedDB.open('covid_db');

	idb.onsuccess = function(event) {

			db = idb.result;
			transaction = db.transaction(["friends"]);
			objectStore = transaction.objectStore("friends");
			
			objectStore.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;	  	  					
				if (cursor) {
				  if( cursor.value.covidDate === null ){				  	
				  	friendsId.push(cursor.key);		  	
				  }				  
				  cursor.continue();
				}else{				  
			      try{
				   transaction.abort();
				  }catch(e){}
				   updateFriends(fetchUrlPost, friendsId);
		  		  
				}				
	  		}
	}

}
