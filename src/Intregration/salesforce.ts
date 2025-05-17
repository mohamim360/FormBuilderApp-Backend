import axios from 'axios';


const url = 'https://orgfarm-4438149030-dev-ed.develop.lightning.force.com.my.salesforce.com/services/data/v63.0/composite/';
const token = 'Bearer token';
const data = require('./composite.json');

axios.post(url, data, {
	headers: {
		'Authorization': token,
		'Content-Type': 'application/json'
	}
}).then(response => {
	console.log(response.data);
}).catch(error => {
	console.error(error);
});
