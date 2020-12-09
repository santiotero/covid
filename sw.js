var db;
var idb;
var transaction;
var objectStore;
var request;
var friendsId  = [];		
var response;
var title = 'Covid19 App Sw';
var options = {
          lang: 'ES',
          body: 'Hay nuevos contactos contagiados Sw',
          icon: 'img/icons/logo-32.png',
          image: 'img/icons/logo-32.png',
          silent: false,
          requireInteraction: true
};
var notify = false;

self.addEventListener("fetch", function(event){
	console.log("service worker fetch");
});

self.addEventListener('sync', function(event) {
	
	console.log("syncCovid event", event);
    
    if (event.tag === 'syncCovid') {
        friendsId = [];
		init(updateFriends, fetchUrlPost);
    }

});


function init(updateFriends, fetchUrlPost){

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