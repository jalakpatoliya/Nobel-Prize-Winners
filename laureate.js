const router = require("express").Router();
const axios = require('axios');
const bodyParser = require("body-parser");
const CircularJSON = require("circular-json");
const _ = require('lodash');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/", async (req, res) => {
    try {
          const { firstname, surname } = req.body;

          let lauretesRaw = await axios.get(
            "http://api.nobelprize.org/v1/laureate.json"
          );
          lauretesRaw = lauretesRaw.data;

          const laureates = lauretesRaw.laureates.map(obj => {
            const data = {
              id: obj.id,
              firstname: obj.firstname,
              surname: obj.surname,
              prizes: obj.prizes.map(prize => {
                return {
                  year: prize.year,
                  category: prize.category,
                  share: prize.share,
                  country: prize.affiliations[0].country
                };
              })
            };
            return data;
          });

          // find laurete by name or surname
          const foundLaureates = laureates.find(laureate => {
            const firstnameRe = new RegExp(firstname, "gi");
            const surnameRe = new RegExp(surname, "gi");
            if (firstname && surname) {
              console.log("both given");
              return (
                laureate.firstname.match(firstnameRe) &&
                laureate.surname.match(surnameRe)
              );
            }
            if (firstname && !surname) {
              console.log("firstname given");
              return laureate.firstname.match(firstnameRe);
            }
            if (surname && !firstname) {
              console.log("surname given");
              return laureate.surname.match(surname);
            }
          });

          /**
           * find contributors for Each prize
           */
            const promises =  foundLaureates.prizes.map(async (prize,index1) => {
              console.log('index1:::::::::::::::',index1);

            const category = prize.category;
            const year = prize.year;
            console.log(`http://api.nobelprize.org/v1/prize.json?year=${year}&category=${category}`);

            let sharedWith = await axios.get(`http://api.nobelprize.org/v1/prize.json?year=${year}&category=${category}`)
            sharedWith = sharedWith.data.prizes.find(prize => {
              const categoryRe = new RegExp(category, 'gi');
              const yearRe = new RegExp(year, 'gi');
              if (prize.category.match(categoryRe) && prize.year.match(yearRe)) {
                return prize.laureates
              }
            })

            // Remove queried person from list
            sharedWith = sharedWith.laureates.filter(laureate => (laureate.firstname != foundLaureates.firstname) && (laureate.firstname != foundLaureates.surname));
            // combining firstname and surname into single string
            sharedWith = sharedWith.map(fellow => {
              return `${fellow.firstname} ${fellow.surname}`;
            })

            // attaching contributors to queried person object
            console.log('shreadWith::::::::::',sharedWith);

            prize.sharedWith = sharedWith

            console.log('prize::::::::::',prize);
            return prize;
          })

          const prizes = await Promise.all(promises);
          
          // attaching prizes to queried person
          foundLaureates.prizes = prizes;
          


          return res.status(200).json({
            foundLaureates
          });
        } catch (error) {
        const errorObj = {
            message:error.message,
            stack:error.stack
        }
        res.status(400).json(errorObj)
    }
});

module.exports = router;
