//by Ethan Lebowitz

models = {"ubrc": {"intercept": -334.2451901, "blitz_rating": 0.4530337, "classical_rating": 0.5658316}, "ubr": {"intercept": -66.8425785, "blitz_rating": 0.508449, "rapid_rating": 0.3563537}, "ubc": {"intercept": -334.2451901, "blitz_rating": 0.4530337, "classical_rating": 0.5658316}, "urc": {"intercept": -350.0336331, "rapid_rating": 0.2658311, "classical_rating": 0.6049978, "bullet_rating": 0.156788}, "brc": {"intercept": -335.6368609, "blitz_rating": 0.4556436, "classical_rating": 0.5634002}, "bc": {"intercept": -335.6368609, "blitz_rating": 0.4556436, "classical_rating": 0.5634002}, "br": {"intercept": -66.671154, "blitz_rating": 0.5103704, "rapid_rating": 0.3542381}, "ub": {"intercept": 79.9044944, "blitz_rating": 0.8033708}, "rc": {"intercept": -397.009453, "classical_rating": 0.6031852, "rapid_rating": 0.4309982}, "uc": {"intercept": -268.8950587, "classical_rating": 0.7616303, "bullet_rating": 0.2386308}, "ur": {"intercept": -54.5835126, "rapid_rating": 0.6575871, "bullet_rating": 0.201434}, "u": {"intercept": 506.0, "bullet_rating": 0.62}, "b": {"intercept": 78.6426799, "blitz_rating": 0.8039702}, "r": {"intercept": -178.7064057, "rapid_rating": 0.8985765}, "c": {"intercept": -277.3399015, "classical_rating": 0.9852217}}
		
ratingCategories = ["bullet","blitz","rapid","classical"]

function getLichessData(username){
	var apiURL = "https://lichess.org/api/user/"+username;
	try{
		var data = fetch(apiURL);
	}catch(e){
		throw(e);
	}
	return data;
}

function getReliableRatingsList(userJSON){
	var threshold = 20; //how many games minimum in category
	var reliableRatings = [];
	for(var i=0; i<ratingCategories.length; i++){
		if(userJSON.perfs[ratingCategories[i]].games >= threshold){
			reliableRatings.push(ratingCategories[i]);
		}
	}
	return reliableRatings
}

function getModelID(categories){
	var id = ""
	for(var i =0; i<categories.length; i++){
		var category = categories[i];
		if(category == "bullet"){
			id += "u";
		}else{
			id += category[0];
		}
	}
	console.log(id);
	if(id == ""){
		throw("not enough games");
	}
	return id
}

function applyModel(modelID, userJSON){
	var model = models[modelID];
	var FIDErating = 0;
	FIDErating += model["intercept"];
	var variables = Object.keys(model).slice(1);
	for(var i=0; i<variables.length; i++){
		var variable = variables[i];
		var category = variable.split("_")[0];
		FIDErating += model[variable] * userJSON.perfs[category].rating;
	}
	return FIDErating
}

function convert(userJSON){
	var reliableRatings = getReliableRatingsList(userJSON);
	console.log(reliableRatings);
	var modelID = getModelID(reliableRatings);
	var FIDErating = Math.round(applyModel(modelID, userJSON));
	return FIDErating;
}

function fillRating(rating){
	console.log(rating);
	const ratingContainer = document.getElementById("FIDE_rating_container");
	ratingContainer.innerHTML = rating;
	const calculateContainer = document.getElementById("calculate_container");
	calculateContainer.innerHTML = "";
}

function fillErrorMessage(msg){
	var bottomText = document.getElementById("bottom_text");
	bottomText.innerHTML = "";
	
	var errorDiv = document.createElement('div');
	var errorText = document.createTextNode(msg);
	errorDiv.appendChild(errorText);
	errorDiv.classList.add("error");
	
	bottomText.appendChild(errorDiv);
}

async function calculate(){
	try{
		var username = document.getElementById("username").value;
		if(username == ""){
			throw("empty input");
		}
		var userJSONpromise = getLichessData(username);
		
		var userJSON = await userJSONpromise.then(data => {
			return data.json()
		});//.catch(error=>throw(error));
		if(userJSON.closed){
			throw("account deleted");
		}
		var FIDErating = convert(userJSON);
		fillRating(FIDErating);
		return true;
	}
	catch(e){
		console.log(e);
		if(e == "empty input"){
			fillErrorMessage("Enter a username");
		}
		else if(e == "TypeError: userJSON is undefined" || e == "SyntaxError: Unexpected end of JSON input" || e == "SyntaxError: JSON.parse: unexpected end of data at line 1 column 1 of the JSON data"){
			fillErrorMessage("Couldn't find that user, are you sure you spelled it right?");
		}
		else if(e == "account deleted"){
			fillErrorMessage("Looks like that account was deleted")
		}
		else if(e == "not enough games"){
			fillErrorMessage("You haven't played enough games yet. You need at least 20 games in a time control category to get a result. Go play some chess!")
		}
		else{
			console.log(e);
			fillErrorMessage("Something went wrong :(");
		}
	}
}