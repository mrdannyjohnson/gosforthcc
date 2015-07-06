var Twit = require('twit');
var schedule = require('node-schedule');
var async = require('async');
var schedule = require('node-schedule');

var T = new Twit({
    consumer_key:         '',
	consumer_secret:      '',
	access_token:         '',
	access_token_secret:  ''
});

rsj = require('rsj');

var goRSS = {
	dayOfWeek	: [1,2,3,4,5,6,0],
	minute 		: [40],
	hour		: [7,10,11]
}
console.log("starting..");
var postRSS = schedule.scheduleJob(goRSS, function(){
    tweetRSS ();
});

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

	console.log("tweet rss..");

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




