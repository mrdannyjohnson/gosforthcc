var Twit = require('twit');
var schedule = require('node-schedule');

var T = new Twit ({
	consumer_key:         '',
	consumer_secret:      '',
	access_token:         '',
	access_token_secret:  ''
});

//schedule 
var goMingle = {
	dayOfWeek	: [1,2,3,5,6,0],
	minute 		: new schedule.Range(0, 59, 10),
	hour		: new schedule.Range(0, 23)
}

var mingling = schedule.scheduleJob(goMingle, function(){

    mingle(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('Mingle: followed @' + name + "\n");
    });
	
});

var goPrune = {
	dayOfWeek	: [1,2,3,5,6,0],
	minute 		: new schedule.Range(0, 59, 5),
	hour		: new schedule.Range(0, 23)
}

var pruning = schedule.scheduleJob(goPrune, function(){

    prune(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('Prune: unfollowed @' + name + "\n");
	});
	
});

var goFB = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: 40,
	hour		: 22
}

var fb = schedule.scheduleJob(goFB, function(){
    
	followBack(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('FollowBack: followed @' + name + "\n");
    });
	
});



var goFave = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: 24,
	hour		: [10,12,13,16,17,18,21,22,23]
}

var favouriting = schedule.scheduleJob(goFave, function(){

	var txt = [
		"cycling",
		"cycling",
		"road bike",
		"tdf",
		"tdf2015",
		"steel bike",
		"titanium bike"
	];

	var random = Math.floor(Math.random() * txt.length);
    favorite(txt[random])
	
});

console.log("starting bot");



/*
mingle(function(err, reply) {
	if(err) return handleError(err);

	var name = reply.screen_name;
	console.log('\nMingle: followed @' + name);
});

//FOLLOW / UNFOLLOW
setInterval(function() {
	
	mingle(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('\nMingle: followed @' + name);
    });

	prune(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('\nPrune: unfollowed @' + name);
	});
	
}, 1000 * 60 * 10);

// RETWEET
setInterval(function() {
	retweet("cycling");
}, 1000 * 60 * 60 * 2.75);

//FAVOURITE 
setInterval(function() {
	favorite("cycling");
}, 1000 * 60 * 60 * 1.5);

//FOLLOWBACK 
setInterval(function() {
	followBack();
}, 1000 * 60 * 60 * 24);

*/

function retweet (mySearch) {

	var today = datestring();
	var myQ = mySearch + " since:" + today;

	//mixed recent popular
	T.get('search/tweets', { q: myQ, count: 20, result_type:"mixed" }, function(err, data, response) {
		
		//console.log(data);
		
		if(err) return handleError(err);

		var max = 0;
		var tweets = data.statuses;
		var i = tweets.length;

		while(i--) {
			var tweet = tweets[i];
			var retweets = tweet.retweet_count;
			var favs = tweet.favorite_count;
			var faved = tweet.favorited;
			var retweeted = tweet.retweeted;
			var sens = tweet.possibly_sensitive;
			var lang = tweet.lang;
			var source = tweet.user.source;
			
			var userFollowers = tweet.user.followers_count;
			var userFriends = tweet.user.friends_count;
			var userUpdates = tweet.user.statuses_count;
			var userProfile = tweet.user.description;
			
			if( (retweets > max) && 
				(retweets > favs) && 
				(faved == false) && 
				(retweeted == false) && 
				(sens == false)
				
			){
				max = retweets;
				var tweetID = tweet.id_str;
			}
		}
		
		T.post('statuses/retweet/:id', { id: tweetID }, function (err, data, response) {
		
			console.log("retweet: " +tweet.text);
			//console.log(err);
			//console.log(data);
			//console.log(response);
		});
		
	});
}

function favorite (mySearch) {

	console.log("favourite");
	var today = datestring();
	var myQ = mySearch + " since:" + today;

	T.get('search/tweets', { q: myQ, count: 20, result_type:"mixed" }, function(err, data, response) {
		
		//console.log(data);
		
		if(err) return handleError(err);

		var max = 0;
		var tweets = data.statuses;
		var i = tweets.length;

		while(i--) {
			var tweet = tweets[i];
			var retweets = tweet.retweet_count;
			var favs = tweet.favorite_count;
			var faved = tweet.favorited;
			var retweeted = tweet.retweeted;
			var sens = tweet.possibly_sensitive;
			var lang = tweet.lang;
			var source = tweet.user.source;
			
			var userFollowers = tweet.user.followers_count;
			var userFriends = tweet.user.friends_count;
			var userUpdates = tweet.user.statuses_count;
			var userProfile = tweet.user.description;
			
			var goodWords = ["cycling", "cycle", "bike", "bikes", "cyclist", "biking", "bicycle", "biker", "riding", "design"];
			var goodProfile = false;
			for (var j = 0; j < goodWords.length; j++) { 
				if (userProfile.indexOf(goodWords[j]) > -1) {
					goodProfile = true
					break;
				} 
			}
			
			console.log("goodProfile: "+goodProfile);
			console.log("userFriends: "+userFriends);
			console.log("sens: "+sens);
			
			if( (favs > max) && 
				(favs > retweets) && 
				(faved == false) && 
				(retweeted == false) && 
				(sens == false) && 
				(lang == 'en') &&
				(goodProfile == true) &&
				(userFriends < 3000) &&
				(userFollowers < 3000)
			) {
				max = favs;
				console.log("ID: " + tweet.id_str);
				var tweetID = tweet.id_str;
				
			}
		}
		
		T.post('favorites/create', { id: tweetID }, function (err, data, response) {
		
			console.log("favourite: " +tweet.text);
			//console.log(err);
			//console.log(data);
			//console.log(response);
		})
		
	});
}


//  choose a random friend of one of your followers, and follow that user
function mingle(callback) {
     
	var followers = [104619004,742143,118685634,20541409,175009537,220785578,19336007,28108762,50984581,39955050,67376997,199230181];
		
	var randFollower  = randIndex(followers);
		
	T.get('followers/ids', { user_id: randFollower }, function(err, reply) {
		if(err) { return callback(err); }

		var friends = reply.ids;
		
		var target = randIndex(friends);
		
		T.get('users/lookup', { user_id : target }, function (err, data, response) {
			//console.log(data[0]);
			var followers = data[0].followers_count;
			var following = data[0].friends_count;
			var mate =  data[0].following;
			var previousAttempt =  data[0].follow_request_sent;
			var ratio = following / followers;
			
			if ( ( mate == false) && (previousAttempt == false) && (ratio > 0.8) && (following > 200) ) {
				console.log(data[0].name);
				console.log("followers: " + followers);
				console.log("following: " + following);
				T.post('friendships/create', { id: target }, callback);
			} 
		});
		
	});
	
};

//  prune your followers list; unfollow a friend that hasn't followed you back
function prune (callback) {

	T.get('followers/ids', function(err, reply) {
		if(err) return callback(err);

		var followers = reply.ids;

		T.get('friends/ids', function(err, reply) {
			if(err) return callback(err);
			
			//console.log("my original list");
			//console.log(reply.ids);
			
			var friends = reply.ids; 
			var pruned = false;
			
			while(!pruned) {
				var target = randIndex(friends);
				var originals = [104619004,742143,118685634,20541409,175009537,220785578,19336007,28108762,50984581,39955050,67376997,199230181];
				
				//if not an original
				if (!(isInArray(target,originals))) {
				
					if(!~followers.indexOf(target)) {
						pruned = true;
						T.post('friendships/destroy', { id: target }, callback);   
					}
				}
			}
			
		});
	});
};

function followBack (callback) {

	console.log("following back");
	var me = "mrdannyjohnson";
				
	T.get('followers/ids', { screen_name : me, count: 10, }, function(err, reply) {
		if(err) { return callback(err); }

		var friends = reply.ids;
		
		for (var i = 0; i < friends.length; i++) { 
			
			var target = friends[i];
			
			T.get('users/lookup', { user_id : target }, function (err, data, response) {
				var mate = data[0].following;
				if  ( mate == false) {
					T.post('friendships/create', { id: target }, callback);
				}
			});
		}
	});
}


//helpers

//get date string for today's date (e.g. '2011-01-01')
function datestring () {
  var d = new Date(Date.now());  //est timezone
  return d.getUTCFullYear()   + '-'
     +  (d.getUTCMonth() + 1) + '-'
     +   d.getDate();
};
//check an array
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

//errors
function handleError(err) {
  console.error('response status:', err.statusCode);
  console.error('data:', err.data);
}
function randIndex (arr) {
	var index = Math.floor(arr.length*Math.random());
	return arr[index];
};