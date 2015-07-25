Parse.initialize("nq6PbT3ZhV1MchAhv0qAVfTPmapSIXhtprq2mXxm", "fXF0qAl2oBwcA9FOMlTjNGxZh0CJEaLbzsZPuMdm");

/*security
get a new key from parse generated and don't check into repo
check for cross site scripting
check validity of input and output from user
*/

/*voting
need to check MVC for multiple views on different machines
already know will need to update total votes
onchange event for total votes
onchange event for status updates
currently that means when people vote they won't see others changes until they reload page
or logout?

when refresh page... not log user out

be able to undo votes
update the vote table again
update topic total in database
update remainVotes for user

autoreset:
votes to 5
topics to 0
status to unknown
*/

/*improvements:

dialog box to prompt if going
yes - going
no - busy
unsure - unknown

flicker when user creates new account and coder list updates
- could add fade in fade out css
- could make it so just the new user is added

Allow users to move the dialog boxes around
- use onmousedown, onmousemove, onmouseup events to update x,y of box
- use jquery drag or equivalent function
*/

//DEBUG flag
var debug = true;

var currentUser = "";
var voterObject = "";

window.onload = function() {
  if(debug){console.log("onload");}
  populateUserList();
  populateTopicVotes();
  eventHandlers();
}; 

var eventHandlers = function() {
  if(debug){console.log("eventHandlers");}

  //iterate through token voting buttons in topic table
  for(var count = 0; count < document.getElementsByClassName('topicvote').length; count++){

      //setup onclick event handlers for each token voting button in topic table
      document.getElementsByClassName('topicvote')[count].onclick = function() {

        //when voting token clicked get the number of votes user selected
        //TODO: see if you can remove 'topicvote' class altogether and get value of the token without spitting the classname
        var voteNumber = this.className.split(" ")[1].split("-")[1];
        //get the row of the topic voted on by traversing up the DOM of the parent nodes of token clicked
        var topicNode = this.parentNode.parentNode.parentNode;
        //save away the current list item clicked
        var tokenClicked = this;
        
        //if user is logged & voterObject exists then continue, else ask them to log in
        if(currentUser && voterObject){

          //get votes user has remaining from database
          var votesRemaining = currentUser.get("votesRemaining");
          //calculate how many tokens user would have left after vote
          var tokensAfterVote = votesRemaining - voteNumber; 

          //user will vote on topic with a value 1-5 tokens
          //before saving vote see if user has enough votes left
          //if votes remaining is valid continue else alert user
          if(tokensAfterVote >= 0){

            //create topic object
            var Topics = Parse.Object.extend("Topics");
            //create query on topic objects
            var query = new Parse.Query(Topics);

            //find topic object matching the id of the row that was clicked in the topic table
            query.get(topicNode.id, {
              //if successful
              success: function(topics) {

                //get previousVotes for this topic from database
                var previousVote = topics.get("vote");
                //if previousVote is undefined set to 0
                if(!previousVote){previousVote=0;}

                setCurrentUserGoing();

                //alert user what they voted and thank them if they used all their votes
                if(tokensAfterVote != 0){
                  alert("You voted "+voteNumber+" on the topic " + topics.get("topic") + ". " + "You have " + tokensAfterVote + " token(s) left.");
                }else{
                  alert("You voted "+voteNumber+" on the topic " + topics.get("topic") + ". " + "You have " + tokensAfterVote + " tokens left. Thanks for voting, see you at Code Night!");
                }

                //creating topic object
                var topicObject = new Topics();
                //saving new vote total for that topic
                topicObject.save({objectId: topicNode.id, vote: previousVote + parseInt(voteNumber)});
                //updating the topic table with the new total
                topicNode.getElementsByClassName('votes')[0].innerHTML = previousVote + parseInt(voteNumber);

                var topicNumber = "Topic"+topics.get("topicOrder");//TODO:Later could use something more robust than order like ID

                // get gobally saved voterObject row and update data
                voterObject.set(topicNumber, voteNumber);
                voterObject.save();
  
                //update votesRemaining for the currentUser
                currentUser.set("votesRemaining", tokensAfterVote);

                //TODO: update what the user voted on user.set("topicVotes", {});
                currentUser.save();
                console.log(tokenClicked);
                tokenClicked.className += " selected";
              },
              error: function(object, error) {
                console.log(error);
              }
            });
          } else {
            alert("You only have enough tokens left to vote " + votesRemaining + " on this topic. Otherwise, you will have to remove "+ (voteNumber-votesRemaining) +" token(s) from other topics to vote "+ voteNumber +" on this topic.")
          }
        } else {
          alert("You need to login before you can vote!");
        }
      };
    }
};

// use cloud code or delete from here
var votingReset = function () {
  if(debug){console.log("votingReset");}
  //get list of users
  //cycle over the length of the array
  //set votesRemaining to 5 for all users
  var query = new Parse.Query(Parse.User);
  query.find({
      success: function(users) {
        for( var i=0; i < users.length; i++ ){
          users[i].set('votesRemaining', 5);
          users[i].save();
        }
      }
  });
};

//set users votes to selected on login
var setSelectedTokens = function() {
  if(debug){console.log("setSelectedTokens");}
  //need to only add selected class to topics voted by that person
  //need to get the topics voted on by that person
  if(voterObject){
    var Topics = Parse.Object.extend("Topics");
    var query = new Parse.Query(Topics);
    query.ascending("topicOrder");
    query.find({
      success: function(topics) {
        var topicString = "";
        for( var i=1; i <= topics.length; i++ ){
          topicString = "Topic"+i;
          if(voterObject.attributes[topicString] != undefined){
            //setselected class
            document.getElementById(topics[i-1].id).getElementsByClassName("star-"+voterObject.attributes[topicString])[0].className += " selected";
          }
        }
      }
    });
  }else{
    console.log("voterObject not found!");
  }
};

var populateTopicVotes = function() {
  if(debug){console.log("populateTopicVotes");}
  var Topics = Parse.Object.extend("Topics");
  var query = new Parse.Query(Topics);
  query.ascending("topicOrder");
  query.find({
    success: function(topics) {
      for( var i=0; i < topics.length; i++ ){
          document.getElementsByClassName('votes')[i].innerHTML = topics[i].get("vote");
      }
    }
  });
};

var populateUserList = function() {
  if(debug){console.log("populateUserList");}
	var query = new Parse.Query(Parse.User);
	query.ascending("username");
	query.find({
  		success: function(users) {
    		for( var i=0; i < users.length; i++ ){
          switch(users[i].get("status")){
            case "busy":
              document.getElementById("user_list").innerHTML += "<li class='status busy'>" + users[i].get('username') + "</li>";
              break;
            case "going":
              document.getElementById("user_list").innerHTML += "<li class='status going'>" + users[i].get('username') + "</li>";
              break;
            case "uknown":
              document.getElementById("user_list").innerHTML += "<li class='status neutral'>" + users[i].get('username') + "</li>";
              break;
            default:
              document.getElementById("user_list").innerHTML += "<li class='status neutral'>" + users[i].get('username') + "</li>";
          }
    		}
  		}
	});
};

var clearUserList = function() {
  if(debug){console.log("clearUserList");}
  document.getElementById("user_list").innerHTML = "";
};

var resetUserList = function() {
  if(debug){console.log("resetUserList");}
  clearUserList();
  populateUserList();
};

var showVotingDialog = function() {
  if(debug){console.log("showVotingDialog");}
  document.getElementById("howto_dialog").style.display = "block";
};

var hideVotingDialog = function() {
  if(debug){console.log("hideVotingDialog");}
  document.getElementById("howto_dialog").style.display = "none";
};

var showDialog = function() {
  if(debug){console.log("showDialog");}
	document.getElementById("login_dialog").style.display = "block";
};

var hideDialog = function() {
  if(debug){console.log("hideDialog");}
	document.getElementById("login_dialog").style.display = "none";
	document.getElementById("dialog_title").innerHTML = "Login";
	document.getElementById("login_dialog_btn").style.display = "inline";
  document.getElementById("email_label").style.display = "none";
  document.getElementById("submit_button").style.display = "none";
  document.getElementById("create_account").style.display = "block";
  document.getElementById("txtbox_email").style.display = "none";
  clearDialog();
};

var clearDialog = function() {
  if(debug){console.log("clearDialog");}
	document.getElementById("txtbox_coder").value = "";
	document.getElementById("txtbox_password").value = "";
	document.getElementById("txtbox_email").value = "";
};


var logout = function() {
  if(debug){console.log("logout");}
		Parse.User.logOut();
    currentUser = "";
    voterObject = "";
		document.getElementById("login_btn_label").innerHTML = "You must login to vote!";
		document.getElementById("login_button").innerHTML = "LogIn";
    document.getElementById("login_button").onclick = showDialog;
    for(var count = 0; count < document.getElementsByClassName('topicvote').length; count++){
      document.getElementsByClassName('topicvote')[count].classList.remove("selected");
    }
};

var toggleDialog = function() {
  if(debug){console.log("toggleDialog");}
	document.getElementById("dialog_title").innerHTML = "Create Account";
	document.getElementById("login_dialog_btn").style.display = "none";
  document.getElementById("email_label").style.display = "inline";
  document.getElementById("txtbox_email").style.display = "inline";
  document.getElementById("create_account").style.display = "none";
  document.getElementById("submit_button").style.display = "inline";
};

var register = function() {
  if(debug){console.log("register");}
	var user = new Parse.User();
	var username = document.getElementById("txtbox_coder").value;
	user.set("username", username);
	user.set("password", document.getElementById("txtbox_password").value);
	user.set("email", document.getElementById("txtbox_email").value);
  user.set("status", "unknown");
  user.set("votesRemaining", 5);
	
	user.signUp(null, {
  		success: function(user) {
        currentUser = Parse.User.current();
  			document.getElementById("login_btn_label").innerHTML = username;
  			document.getElementById("login_button").innerHTML = "Logout";
    		document.getElementById("login_button").onclick = logout;
        setVoterObject(); //must come after set current user 
        resetUserList();
    		hideDialog();
  		},
  		error: function(user, error) {
    		alert("Error: " + error.code + " " + error.message);
  		}
	});
}

var login = function() {
  if(debug){console.log("login");}
	var username = document.getElementById("txtbox_coder").value;
	Parse.User.logIn(username, document.getElementById("txtbox_password").value, {
    success: function(user) {
      currentUser = Parse.User.current();
      document.getElementById("login_btn_label").innerHTML = username;
  	  document.getElementById("login_button").innerHTML = "Logout";
      document.getElementById("login_button").onclick = logout;
      setVoterObject(); //must come after set current user 
      //check if votes remaining is less than 5
      //check if current userStatus is 'going'
      if(currentUser.get("votesRemaining") < 5){
        setCurrentUserGoing();
      }else if (currentUser.get("votesRemaining") === 5){
        setCurrentUserBusy();
      }
      hideDialog();
    },
    error: function(user, error) {
   	  alert("Error: " + error.code + " " + error.message);
    }
  });
};

var setVoterObject = function() {
    if(debug){console.log("setVoterObject");}
    //create vote object
    var Votes = Parse.Object.extend("Votes");
    var query = new Parse.Query(Votes);
    query.equalTo("Voters", currentUser);
    query.find({
      success:function(results) {
        //if user already exists in votes database get row for currentUser and store in global voterObject
        if(results.length > 0) {
          voterObject = results[0]; 
        }else{
            //if user is not in votes database
            voterObject = new Votes();
            var relation = voterObject.relation("Voters");
            relation.add(currentUser);
            voterObject.save();
        }
        setSelectedTokens();
      },
      fail:function(object, error){
        console.log('Voter table not found.'+error);
      }
    });
};

var setCurrentUserGoing = function () {
  if(debug){console.log("setCurrentUserGoing");}
  if((currentUser.get("status") != "going")){
    //update currentUsers status to 'going'
    currentUser.set("status", "going");
    currentUser.save();
    //update the view
    var userList = document.getElementById("user_list").getElementsByClassName("status");
    var tmpuser = "";
    for(var tmp = 0; tmp < userList.length; tmp++ ){
      tmpuser = userList[tmp].innerHTML;
      if(tmpuser === currentUser.get("username")){
        document.getElementById("user_list").getElementsByClassName("status")[tmp].className = "status going";
        break;
      }
    }
  }
};

var setCurrentUserBusy = function () {
  if(debug){console.log("setCurrentUserBusy");}
  if((currentUser.get("status") != "busy")){
    //update currentUsers status to 'busy'
    currentUser.set("status", "busy");
    currentUser.save();
    //update the view
    var userList = document.getElementById("user_list").getElementsByClassName("status");
    var tmpuser = "";
    for(var tmp = 0; tmp < userList.length; tmp++ ){
      tmpuser = userList[tmp].innerHTML;
      if(tmpuser === currentUser.get("username")){
        document.getElementById("user_list").getElementsByClassName("status")[tmp].className = "status busy";
        break;
      }
    }
  }
};





