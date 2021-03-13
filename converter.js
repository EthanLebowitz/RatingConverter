models = {"ubrc": {"intercept": -334.2451901, "blitz_rating": 0.4530337, "classical_rating": 0.5658316}, "ubr": {"intercept": -66.8425785, "blitz_rating": 0.508449, "rapid_rating": 0.3563537}, "ubc": {"intercept": -334.2451901, "blitz_rating": 0.4530337, "classical_rating": 0.5658316}, "urc": {"intercept": -350.0336331, "rapid_rating": 0.2658311, "classical_rating": 0.6049978, "bullet_rating": 0.156788}, "brc": {"intercept": -335.6368609, "blitz_rating": 0.4556436, "classical_rating": 0.5634002}, "bc": {"intercept": -335.6368609, "blitz_rating": 0.4556436, "classical_rating": 0.5634002}, "br": {"intercept": -66.671154, "blitz_rating": 0.5103704, "rapid_rating": 0.3542381}, "ub": {"intercept": 79.9044944, "blitz_rating": 0.8033708}, "rc": {"intercept": -397.009453, "classical_rating": 0.6031852, "rapid_rating": 0.4309982}, "uc": {"intercept": -268.8950587, "classical_rating": 0.7616303, "bullet_rating": 0.2386308}, "ur": {"intercept": -54.5835126, "rapid_rating": 0.6575871, "bullet_rating": 0.201434}, "u": {"intercept": 506.0, "bullet_rating": 0.62}, "b": {"intercept": 78.6426799, "blitz_rating": 0.8039702}, "r": {"intercept": -178.7064057, "rapid_rating": 0.8985765}, "c": {"intercept": -277.3399015, "classical_rating": 0.9852217}}
		
ratingCategories = ["bullet","blitz","rapid","classical"]

function getLichessData(username){
	var apiURL = "https://lichess.org/api/user/"+username;
	return fetch(apiURL);
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
}

async function calculate(){
	var username = document.getElementById("username").value;
	var userJSONpromise = getLichessData(username);
	
	var userJSON = await userJSONpromise.then(data => {return data.json()}).catch(error=>console.log(error));
	var FIDErating = convert(userJSON);
	fillRating(FIDErating);
}