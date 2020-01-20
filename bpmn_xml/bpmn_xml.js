const convert = require('xml-js');
const fs = require('fs');
fs.readFile('./module/Horoscope.xml', 'utf8', (err, data)=>{
	if(err){
		console.log(err);
	} else {
		const result1 = convert.xml2json(data, {compact: true, spaces: 4});
		console.log("Result: ", result1);
	}
});
