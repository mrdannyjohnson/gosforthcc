var Twit = require('twit');
var schedule = require('node-schedule');
var async = require('async');
var rsj = require('rsj');


var T = new Twit({
    consumer_key:         'MBHtrLb4FsluxcHXfia587kQM',
	consumer_secret:      'JmzdD4WttRZ0rkHckV2ezwbL3mPyvjOOcgDCWfaROL46ALpM1K',
	access_token:         '3346328271-ygHWTQ01wmA3Hj7oI49RPheGtiR2atKVPws8WvO',
	access_token_secret:  'Ks7aWIxHvijeYquHitHoIdnc8jtTUyqp1J8KcjQF2SI14'
});

console.log("starting bot");

var goRSS = {
	dayOfWeek	: [1,2,3,4,5,6,0],
	minute 		: [44],
	hour		: [7,11,14]
}

var goMingle = {
	dayOfWeek	: [1,2,3,4,5,6,0],
	minute 		: new schedule.Range(0, 59, 15),
	hour		: new schedule.Range(0, 23)
}
var goPrune = {
	dayOfWeek	: [1,2,3,4,5,6,0],
	minute 		: new schedule.Range(0, 59, 15),
	hour		: new schedule.Range(0, 23)
}

var goFB = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: 58,
	hour		: 23
}
var goFave = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: [11,31,51],
	hour		: [7,8,9,10,12,13,15,16,17,18,21,22,23]
}
var goRetweet = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: [9],
	hour		: [13,16,19]
}


var postRSS = schedule.scheduleJob(goRSS, function(){
    tweetRSS ();
});

var mingling = schedule.scheduleJob(goMingle, function(){

    mingle(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('Mingle: followed @' + name + "\n");
    });
	
});


var pruning = schedule.scheduleJob(goPrune, function(){

    prune(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('Prune: unfollowed @' + name + "\n");
	});
	
});


var fb = schedule.scheduleJob(goFB, function(){
    
	followBack(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('FollowBack: followed @' + name + "\n");
    });
	
});

var favouriting = schedule.scheduleJob(goFave, function(){

	var txt = ["cycling",
		"cycling",
		"cycling",
		"tdf2015",
		"tdf2015",
		"bike",
		"tdf"];

	var random = Math.floor(Math.random() * txt.length);
	var keyword = txt[random];
	
	favorite(keyword, function(err, reply) {
		if(err) return handleError(err);

		//console.log(reply.user.name);
		console.log("fave"+reply.text);
		var target = reply.user.id_str;
		
		T.post('friendships/create', { id: target }, function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			console.log('Mingle: followed @' + name + "\n");
		});
		
	});
});



var retweeting = schedule.scheduleJob(goRetweet, function(){

	var txt = ["cycling",
		"cycling",
		"cycling",
		"tdf",
		"tdf2015",
		"tdf2015"
	];

	var random = Math.floor(Math.random() * txt.length);
	var keyword = txt[random];
	
	retweet(keyword, function(err, reply) {
		if(err) return handleError(err);

		//console.log(reply.user.name);
		console.log("retweet"+reply.text);
		var target = reply.user.id_str;
		
		T.post('friendships/create', { id: target }, function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			console.log('Mingle: followed @' + name + "\n");
		});
		
	});
});


function retweet (mySearch, callback) {

	console.log("retweeting: " + mySearch );
	var today = datestring();
	var myQ = mySearch + " since:" + today;

	T.get('search/tweets', { q: myQ, count: 300, result_type:"mixed" }, function(err, data, response) {
		
		//console.log(data);
		
		if(err) return handleError(err);

		var tweets = data.statuses;
		var potentials = [];
		//console.log(tweets[0]);		
		for (var i = 0; i < tweets.length; i++) { 
			
			var tweet = tweets[i];
			var text = tweet.text;
			var retweets = tweet.retweet_count;
			var favs = tweet.favorite_count;
			var faved = tweet.favorited;
			var retweeted = tweet.retweeted;
			var sens = tweet.possibly_sensitive;
			var lang = tweet.lang;
			var source = tweet.source;
			
			var userFollowers = tweet.user.followers_count;
			var userFriends = tweet.user.friends_count;
			var userUpdates = tweet.user.statuses_count;
			var userProfile = tweet.user.description;
			var following = tweet.user.following;
			
			//console.log(i + ": ID: " + tweet.id_str + ": friends: " + userFriends + ": followers: " + userFollowers + ": favs: " + favs);
			
			var goodProfile = false;
			if (userProfile.match(/cycling|cycle|bike|bikes|cyclist|biking|bicycle|biker|riding|design/gi) != null) {
				goodProfile = true;
			}
			
			var goodSource = false;
			if (source.match(/Twitter|Android|Apple|TweetDeck|Tweet|Web|iPhone/gi) != null) {
				goodSource = true;
			}
			
			var badWords = false;
			if (text.match(/endomondo|strava/gi) != null) {
				badWords = true;
			}
			
			var passmark = favs + retweets;
			
			if( (faved == false) &&
				(retweeted == false) && 
				(sens == false) && 
				(lang == 'en') &&
				
				(goodProfile == true) &&
				(goodSource == true) &&
				(badWords == false) &&
				
				(passmark > 2) &&
				(passmark < 30) &&
				(userFollowers < 50000)
				
			) {
				//console.log(userProfile);
				//console.log(source);
				var tweetID = tweet.id_str;
				potentials.push(tweetID);
			}
			
			if (i == tweets.length-1) {
				//console.log("potentials: " + potentials.length);
				
				if (potentials.length > 0) {
					var random = Math.floor(Math.random() * potentials.length);	
					//console.log(potentials[random]);
					T.post('statuses/retweet/:id', { id: potentials[random] }, callback);
				} else {
					//console.log("No good matches");
				}
			}
		}
	});
}


function favorite (mySearch, callback) {

	//console.log("favourite: " + mySearch );
	var today = datestring();
	var myQ = mySearch + " since:" + today;

	T.get('search/tweets', { q: myQ, count: 300, result_type:"mixed" }, function(err, data, response) {
		
		//console.log(data);
		
		if(err) return handleError(err);

		var tweets = data.statuses;
		var potentials = [];
		//console.log(tweets[0]);		
		for (var i = 0; i < tweets.length; i++) { 
			
			var tweet = tweets[i];
			var text = tweet.text;
			var retweets = tweet.retweet_count;
			var favs = tweet.favorite_count;
			var faved = tweet.favorited;
			var retweeted = tweet.retweeted;
			var sens = tweet.possibly_sensitive;
			var lang = tweet.lang;
			var source = tweet.source;
			
			var userFollowers = tweet.user.followers_count;
			var userFriends = tweet.user.friends_count;
			var userUpdates = tweet.user.statuses_count;
			var userProfile = tweet.user.description;
			var following = tweet.user.following;
			
			//console.log(i + ": ID: " + tweet.id_str + ": friends: " + userFriends + ": followers: " + userFollowers + ": favs: " + favs);
			
			var goodProfile = false;
			if (userProfile.match(/cycling|cycle|bike|bikes|cyclist|biking|bicycle|biker|riding|design/gi) != null) {
				goodProfile = true;
			}
			
			var goodSource = false;
			if (source.match(/Twitter|Android|Apple|TweetDeck|Tweet|Web|iPhone/gi) != null) {
				goodSource = true;
			}
			var badWords = false;
			if (text.match(/endomondo/gi) != null) {
				badWords = true;
			}
			
			
			if ((goodProfile == true) &&
				(goodSource == true) &&
				(badWords == false)){
					//console.log("favs: "+favs);
					//console.log("userFollowers: "+userFollowers);
				}
			
			
			if( (faved == false) &&
				(following == false) &&
				(retweeted == false) && 
				(sens == false) && 
				(lang == 'en') &&
				
				(goodProfile == true) &&
				(goodSource == true) &&
				(badWords == false) &&
				
				//(favs >= 1) &&
				(userUpdates > 100) &&
				(userFollowers < 10000) &&
				(userFriends < 10000)
				
			) {
				//console.log(userProfile);
				//console.log(source);
				var tweetID = tweet.id_str;
				potentials.push(tweetID);
			}
			
			if (i == tweets.length-1) {
				//console.log("potentials: " + potentials.length);
				
				if (potentials.length > 0) {
					var random = Math.floor(Math.random() * potentials.length);	
					//console.log(potentials[random]);
					T.post('favorites/create', { id: potentials[random] }, callback);
				} else {
					//console.log("No good matches");
				}
			}
		}
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
				//console.log(data[0].name);
				//console.log("followers: " + followers);
				//console.log("following: " + following);
				T.post('friendships/create', { id: target }, callback);
			} 
		});
		
	});
	
};

//  prune your followers list; unfollow a friend that hasn't followed you back
function prune (callback) {

	//console.log("pruning");

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

	//console.log("following back");
	var me = "gosforthcc";
				
	T.get('followers/ids', { screen_name : me, count: 10, }, function(err, reply) {
		if(err) { return callback(err); }

		var friends = reply.ids;
		
		for (var i = 0; i < friends.length; i++) { 
			
			var target = friends[i];
			
			T.get('users/lookup', { user_id : target }, function (err, data, response) {
				var mate = data[0].following;
				
				if  ( mate == false) {
				
					var newFriend = data[0]
					//console.log(newFriend.screen_name);
					T.post('friendships/create', { id: newFriend.id_str }, callback);
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


//RSS!!

/*
current issues:
rouler posts "title     "
Outside online posts tags &nsbp?
*/


/*
good
radavist
inrng
daves bike blog
gosforth.cc
milltag
london cycling
bicycle design
*/

var feeds = ["http://ibikelondon.blogspot.com/feeds/posts/default",
			"http://feeds2.feedburner.com/LondonCyclist",
			"http://gosforth.cc/feed",
			"http://feeds.feedburner.com/inrng/inrng0",
			"http://feeds.feedburner.com/blogspot/arls",
			"http://feeds.feedburner.com/CyclingInfo",
			"http://www.thewashingmachinepost.net/rss/thewashingmachinepost.xml",
			"http://www.bikes-n-stuff.com/feed/",
			"http://theradavist.com/feed/",
			"http://feeds.feedburner.com/davesbikeblog",
			"http://pages.rapha.cc/feed/atom",
			//"http://rouleur.cc/taxonomy/term/46/feed",
			//"http://rouleur.cc/taxonomy/term/47/feed",
			"http://www.bikes-n-stuff.com/feed/",
			"http://feeds.feedburner.com/CyclingInfo",
			"http://feeds.bbci.co.uk/sport/0/cycling/rss.xml",
			"http://www.headsetpress.co.uk/feed/",
			"http://feeds2.feedburner.com/Cycleexif",
			"http://feeds.feedburner.com/BicycleDesign",
			"http://www.cafeducycliste.com/blog/?feed=rss",
			"http://velonews.competitor.com/feed",
			"http://milltag.cc/new/feed",
			"http://feeds.feedburner.com/defringecom",
			"http://feeds.feedburner.com/CycleLove",
			"http://jaggad.com/blog/cycling/feed/",
			//"http://www.outsideonline.com/taxonomy/term/5216/feed",
			//"http://www.outsideonline.com/taxonomy/term/3936/feed",
			//"http://www.outsideonline.com/taxonomy/term/7036/feed",
			//"http://www.outsideonline.com/taxonomy/term/4536/feed",
			"http://www.cyclingweekly.co.uk/feed"
		];

var testing = [
			//"http://www.outsideonline.com/taxonomy/term/5216/feed",
			//"http://www.outsideonline.com/taxonomy/term/3936/feed",
			//"http://www.outsideonline.com/taxonomy/term/7036/feed",
			"http://www.outsideonline.com/taxonomy/term/4536/feed"
		];		
		
		
var tweets = [];

function tweetRSS () {

	//console.log("tweet rss..");

	async.waterfall([
		
		function(callback) {
			
			// get new tweets
			
			var newTweets = [];
		
			async.each(feeds, function(feed, cb) {

				// Perform operation on file here.
				//console.log('Processing feed ' + feed);

				rsj.r2j(feed,function(json) { 
		
					var obj = JSON.parse(json);
				
					//console.log(obj[0].summary);
					
					var title = obj[0].title;
					var link = obj[0].link;
					var date = obj[0].date;
					var txt = obj[0].description;	
					var rex = /(<([^>]+)>)/ig;
					var continued = txt.replace(rex , "");
					var stripped = continued.replace(/(\r\n|\n|\r)/gm,"");

					var space = 140 - 23 - title.length - 3;
					var content = (truncate(stripped, space, true));
					
					//bad feed content:
					if ( (feed == "http://www.outsideonline.com/taxonomy/term/5216/feed") ||
					(feed == "http://www.outsideonline.com/taxonomy/term/3936/feed") ||
					(feed == "http://www.outsideonline.com/taxonomy/term/7036/feed") ||
					(feed == "http://www.outsideonline.com/taxonomy/term/4536/feed") ||
					(feed == "http://rouleur.cc/taxonomy/term/46/feed") ||
					(feed == "http://rouleur.cc/taxonomy/term/47/feed") ) {
						var mytweet = title + ": " + link;
					} else {
						var mytweet = title + ": " + link + " " + content;
					}
					var x = decodeHtmlEntity(mytweet);
					//console.log(x);
					
					var res = {
						name	: feed,
						//via	: via,
						tweet	: x,
						tweeted	: false,
						date	: date
					}
					
					newTweets.push(res);
					cb();

				});
				
			}, function(err){
				// if any of the file processing produced an error, err would equal that error
				if( err ) {
					//console.log('error');
				} else {
					//console.log('done');
					callback(null, newTweets);
				}
			});
			
		},
		function(newTweets, callback) {
			
			//console.log("new:" + newTweets);
			
			for (var j = 0; j < newTweets.length; j++) {
				var ntName = newTweets[j].name;
				var ntDate = newTweets[j].date;
			
				if (tweets.length > 0) {
				
					for (var i = 0; i < tweets.length; i++) {
						var tName = tweets[i].name;
						var tDate = tweets[i].date;
						
				
						if ( (tName === ntName) && (tDate == ntDate) ){
							
							//console.log("match");
							//if match, leave old in place
							
						} else {
						
							//console.log("new");
							//if new, remove old, add new
							tweets = tweets.filter(function (value) {
								return value.name !== newTweets[j].name;
							});
							
							tweets.push(newTweets[j]);
							
						}
					}
				} else {
					tweets.push(newTweets[j]);
				}
				
				if (j == newTweets.length-1) {
					callback(null, tweets);
				}
			}
		},
		function(tweets, callback) {
			
			// pass tweets along
			//console.log("BEFORE TWEETING");
			//console.log("==============");
			//console.log(tweets);

			var filteredTweets = tweets.filter(function (value) {
				return value.tweeted == false;
			});

			var random = Math.floor(Math.random() * filteredTweets.length);
			var myTweet = filteredTweets[random];

			myTweet.replace(/&nbsp;/gm," ")
			
			console.log(myTweet);
			
			T.post('statuses/update', { status: myTweet.tweet }, function(err, data, response) {
				console.log("Tweet from rss");
				console.log(myTweet.name);
				//console.log("==============");
				console.log(data.text)
				
				
				myTweet.tweeted = true;
				
				//console.log("AFTER TWEETING");
				//console.log("==============");
				//console.log(tweets);
				
			});
			
			callback(null, 'done');
		}
	], function (err, result) {
		// result now equals 'done'
		console.log(result);
	});
}


//helpers
function truncate (string, n, useWordBoundary){
	var toLong = string.length>n,
	s_ = toLong ? string.substr(0,n-1) : string;
	s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
	return  toLong ? s_ + '...' : s_;
};

var decodeHtmlEntity = function(str) {
	return str.replace(/&#(\d+);/g, function(match, dec) {
		return String.fromCharCode(dec);
	});
};


/*  
// @mrdannyjohnson
*/

var M = new Twit ({
	consumer_key:         'UgS5whAchDGHRdZIpMBgzA',
	consumer_secret:      'DofEU1Rcen1jim2eUYfIzbmRZyBPyv1qbOA2gahJVB4',
	access_token:         '252587815-PWNmKS7b40C2fqXKehZmOESkp4gpE2Dg40oJFYEH',
	access_token_secret:  'bmRVkpRmY6I3WuNJBfEu6FMzJIKQfhUHfZX2528qtfVRc'
});


var MgoRSS = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: [37],
	hour		: [1,8]
}

var MgoMingle = {
	dayOfWeek	: [1,2,3,4,5],
	minute 		: new schedule.Range(0, 59, 20),
	hour		: new schedule.Range(0, 23)
}
var MgoPrune = {
	dayOfWeek	: [5,6,0],
	minute 		: new schedule.Range(0, 59, 5),
	hour		: new schedule.Range(0, 23)
}

var MgoFB = {
	dayOfWeek	: [0,2,4,6],
	minute 		: 55,
	hour		: 23
}
var MgoFave = {
	dayOfWeek	: [0,1,2,3,4,5,6],
	minute 		: [11],
	hour		: [7,8,16,17]
}
var MgoRetweet = {
	dayOfWeek	: [0,2,3,4,6],
	minute 		: [20],
	hour		: [20,45]
}

var MpostRSS = schedule.scheduleJob(MgoRSS, function(){
    tweetRSS ();
});

var Mmingling = schedule.scheduleJob(MgoMingle, function(){

    Mmingle(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('Mingle: followed @' + name + "\n");
    });
	
});


var Mpruning = schedule.scheduleJob(MgoPrune, function(){

    Mprune(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('Prune: unfollowed @' + name + "\n");
	});
	
});


var Mfb = schedule.scheduleJob(MgoFB, function(){
    
	MfollowBack(function(err, reply) {
		if(err) return handleError(err);

		var name = reply.screen_name;
		console.log('FollowBack: followed @' + name + "\n");
    });
	
});

var Mfavouriting = schedule.scheduleJob(MgoFave, function(){

	var txt = ["cycling",
		"cycling",
		"cycling",
		"tdf2015",
		"tdf2015",
		"bike",
		"tdf"];

	var random = Math.floor(Math.random() * txt.length);
	var keyword = txt[random];
	
	favorite(keyword, function(err, reply) {
		if(err) return handleError(err);

		//console.log(reply.user.name);
		console.log("faving" + reply.text);
		var target = reply.user.id_str;
		
		M.post('friendships/create', { id: target }, function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			console.log('Mingle: followed @' + name + "\n");
		});
		
	});
});



var Mretweeting = schedule.scheduleJob(MgoRetweet, function(){

	var txt = ["cycling",
		"cycling",
		"cycling",
		"tdf",
		"tdf2015",
		"tdf2015"
	];

	var random = Math.floor(Math.random() * txt.length);
	var keyword = txt[random];
	
	retweet(keyword, function(err, reply) {
		if(err) return handleError(err);

		//console.log(reply.user.name);
		console.log("retweeting" + reply.text);
		var target = reply.user.id_str;
		
		M.post('friendships/create', { id: target }, function(err, reply) {
			if(err) return handleError(err);

			var name = reply.screen_name;
			console.log('Mingle: followed @' + name + "\n");
		});
		
	});
});


function Mretweet (mySearch, callback) {

	//console.log("retweeting: " + mySearch );
	var today = datestring();
	var myQ = mySearch + " since:" + today;

	M.get('search/tweets', { q: myQ, count: 500, result_type:"popular" }, function(err, data, response) {
		
		//console.log(data);
		
		if(err) return handleError(err);

		var tweets = data.statuses;
		var potentials = [];
		//console.log(tweets[0]);		
		for (var i = 0; i < tweets.length; i++) { 
			
			var tweet = tweets[i];
			var text = tweet.text;
			var retweets = tweet.retweet_count;
			var favs = tweet.favorite_count;
			var faved = tweet.favorited;
			var retweeted = tweet.retweeted;
			var sens = tweet.possibly_sensitive;
			var lang = tweet.lang;
			var source = tweet.source;
			
			var userFollowers = tweet.user.followers_count;
			var userFriends = tweet.user.friends_count;
			var userUpdates = tweet.user.statuses_count;
			var userProfile = tweet.user.description;
			var following = tweet.user.following;
			
			//console.log(i + ": ID: " + tweet.id_str + ": friends: " + userFriends + ": followers: " + userFollowers + ": favs: " + favs);
			
			var goodProfile = false;
			if (userProfile.match(/cycling|cycle|bike|bikes|cyclist|biking|bicycle|biker|riding|design/gi) != null) {
				goodProfile = true;
			}
			
			var goodSource = false;
			if (source.match(/Twitter|Android|Apple|TweetDeck|Tweet|Web|iPhone/gi) != null) {
				goodSource = true;
			}
			
			var badWords = false;
			if (text.match(/endomondo|strava/gi) != null) {
				badWords = true;
			}
			
			var passmark = favs + retweets;
			
			if( (faved == false) &&
				(retweeted == false) && 
				(sens == false) && 
				(lang == 'en') &&
				
				(goodProfile == true) &&
				(goodSource == true) &&
				(badWords == false) &&
				
				(passmark > 1) &&
				(passmark < 50) &&
				(userFollowers < 20000)
				
			) {
				//console.log(userProfile);
				//console.log(source);
				var tweetID = tweet.id_str;
				potentials.push(tweetID);
			}
			
			if (i == tweets.length-1) {
				//console.log("potentials: " + potentials.length);
				
				if (potentials.length > 0) {
					var random = Math.floor(Math.random() * potentials.length);	
					//console.log(potentials[random]);
					M.post('statuses/retweet/:id', { id: potentials[random] }, callback);
				} else {
					//console.log("No good matches");
				}
			}
		}
	});
}


function Mfavorite (mySearch, callback) {

	//console.log("favourite: " + mySearch );
	var today = datestring();
	var myQ = mySearch + " since:" + today;

	M.get('search/tweets', { q: myQ, count: 500, result_type:"mixed" }, function(err, data, response) {
		
		//console.log(data);
		
		if(err) return handleError(err);

		var tweets = data.statuses;
		var potentials = [];
		//console.log(tweets[0]);		
		for (var i = 0; i < tweets.length; i++) { 
			
			var tweet = tweets[i];
			var text = tweet.text;
			var retweets = tweet.retweet_count;
			var favs = tweet.favorite_count;
			var faved = tweet.favorited;
			var retweeted = tweet.retweeted;
			var sens = tweet.possibly_sensitive;
			var lang = tweet.lang;
			var source = tweet.source;
			
			var userFollowers = tweet.user.followers_count;
			var userFriends = tweet.user.friends_count;
			var userUpdates = tweet.user.statuses_count;
			var userProfile = tweet.user.description;
			var following = tweet.user.following;
			
			//console.log(i + ": ID: " + tweet.id_str + ": friends: " + userFriends + ": followers: " + userFollowers + ": favs: " + favs);
			
			var goodProfile = false;
			if (userProfile.match(/cycling|cycle|bike|bikes|cyclist|biking|bicycle|biker|riding|design/gi) != null) {
				goodProfile = true;
			}
			
			var goodSource = false;
			if (source.match(/Twitter|Android|Apple|TweetDeck|Tweet|Web|iPhone/gi) != null) {
				goodSource = true;
			}
			var badWords = false;
			if (text.match(/endomondo/gi) != null) {
				badWords = true;
			}
			
			
			if ((goodProfile == true) &&
				(goodSource == true) &&
				(badWords == false)){
					//console.log("favs: "+favs);
					//console.log("userFollowers: "+userFollowers);
				}
			
			var passmark = favs + retweets;
			
			if( (faved == false) &&
				//(following == false) &&
				(retweeted == false) && 
				(sens == false) && 
				(lang == 'en') &&
				
				(goodProfile == true) &&
				(goodSource == true) &&
				(badWords == false) &&
				
				(passmark >= 1) &&
				(passmark < 20) &&
				(userUpdates > 100) &&
				(userFollowers < 10000) &&
				(userFriends < 10000)
				
			) {
				//console.log(userProfile);
				//console.log(source);
				var tweetID = tweet.id_str;
				potentials.push(tweetID);
			}
			
			if (i == tweets.length-1) {
				//console.log("potentials: " + potentials.length);
				
				if (potentials.length > 0) {
					var random = Math.floor(Math.random() * potentials.length);	
					//console.log(potentials[random]);
					M.post('favorites/create', { id: potentials[random] }, callback);
				} else {
				//	console.log("No good matches");
				}
			}
		}
	});
}


//  choose a random friend of one of your followers, and follow that user
function Mmingle(callback) {
     
	var followers = [104619004,742143,118685634,20541409,175009537,220785578,19336007,28108762,50984581,39955050,67376997,199230181];
		
	var randFollower  = randIndex(followers);
		
	M.get('followers/ids', { user_id: randFollower }, function(err, reply) {
		if(err) { return callback(err); }

		var friends = reply.ids;
		
		var target = randIndex(friends);
		
		M.get('users/lookup', { user_id : target }, function (err, data, response) {
			//console.log(data[0]);
			var followers = data[0].followers_count;
			var following = data[0].friends_count;
			var mate =  data[0].following;
			var previousAttempt =  data[0].follow_request_sent;
			var ratio = following / followers;
			
			if ( ( mate == false) && (previousAttempt == false) && (ratio > 0.8) && (following > 200) ) {
				//console.log(data[0].name);
				//console.log("followers: " + followers);
				//console.log("following: " + following);
				M.post('friendships/create', { id: target }, callback);
			} 
		});
		
	});
	
};

//  prune your followers list; unfollow a friend that hasn't followed you back
function Mprune (callback) {

	//console.log("pruning");

	M.get('followers/ids', function(err, reply) {
		if(err) return callback(err);

		var followers = reply.ids;

		M.get('friends/ids', function(err, reply) {
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
						M.post('friendships/destroy', { id: target }, callback);   
					}
				}
			}
			
		});
	});
};

function MfollowBack (callback) {

	//console.log("following back");
	var me = "mrdannyjohnson";
				
	M.get('followers/ids', { screen_name : me, count: 10, }, function(err, reply) {
		if(err) { return callback(err); }

		var friends = reply.ids;
		
		for (var i = 0; i < friends.length; i++) { 
			
			var target = friends[i];
			
			M.get('users/lookup', { user_id : target }, function (err, data, response) {
				var mate = data[0].following;
				
				if  ( mate == false) {
				
					var newFriend = data[0]
					//console.log(newFriend.screen_name);
					M.post('friendships/create', { id: newFriend.id_str }, callback);
				}
			});
		}
	});
}

