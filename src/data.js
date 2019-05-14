let _nextId = 100;

class EntityManager {

    static getTypes() {
        return {
            user: {
                id: "user",
                displayName: "User",
                idProperty: "userId",
                properties: {
                    name: "string",
                    email: "string",
                    bio: "text",
                    company: "string"
                },
                summaryProperties: ["name"]
            },
            trip: {
                id: "trip",
                displayName: "Trip",
                idProperty: "tripId",
                properties: {
                    userId: "uri",
                    origin: "uri",
                    destination: "uri",
                    departureDateTime: "timestamp",
                    arrivalDateTime: "timestamp",
                    purpose: "string"
                },
                summaryProperties: ["userId", "departureDateTime"]
            },
            place: {
                id: "place",
                displayName: "Place",
                idProperty: "placeId",
                properties: {
                    name: "string",
                    zipcode: "integer",
                    city: "string",
                    state: "string",
                    county: "string",
                    country: "string"
                },
                summaryProperties: ["name", "country"]
            }
        };
    }

    static dedupe(entityList, idKey) {
        const results = {};
        return entityList.map(e => {
            const id = e[idKey];
            if(!(id in results)) {
                results[id] = e;
                return e;
            } else {
                return null;
            }

        }).filter(e => e !== null);
    }

    static getAll(entityType) {
        switch (entityType) {
            case 'user':
                return [
                    {
                        "userId": "tonystark",
                        "name": "Tony Stark",
                        "email": "tony@avengers.org",
                        "bio": "Iron Man is a fictional superhero appearing in American comic books published by Marvel Comics. The character was co-created by writer and editor Stan Lee, developed by scripter Larry Lieber, and designed by artists Don Heck and Jack Kirby. The character made his first appearance in Tales of Suspense #39 (cover dated March 1963), and received his own title in Iron Man #1 (May 1968).",
                        "company": "Avengers Inc."
                    },
                    {
                        "userId": "thorodinson",
                        "name": "Thor Odinson",
                        "email": "thor@avengers.org",
                        "bio": "Thor is a fictional superhero appearing in American comic books published by Marvel Comics. The character, which is based on the Norse deity of the same name, is the Asgardian god of thunder who possesses the enchanted hammer, Mjolnir, which grants him the ability to fly and manipulate weather amongst his other superhuman attributes.",
                        "company": "Avengers Inc."
                    },
                    {
                        "userId": "stevenrogers",
                        "name": "Steven Rogers",
                        "email": "steven@avengers.org",
                        "bio": "Captain America is a fictional superhero appearing in American comic books published by Marvel Comics. Created by cartoonists Joe Simon and Jack Kirby, the character first appeared in Captain America Comics #1 (cover dated March 1941) from Timely Comics, a predecessor of Marvel Comics. Captain America was designed as a patriotic supersoldier who often fought the Axis powers of World War II and was Timely Comics' most popular character during the wartime period. The popularity of superheroes waned following the war and the Captain America comic book was discontinued in 1950, with a short-lived revival in 1953. Since Marvel Comics revived the character in 1964, Captain America has remained in publication.",
                        "company": "Avengers Inc."
                    },
                    {
                        "userId": "stephenstrange",
                        "name": "Stephen Strange",
                        "email": "stephen@avengers.org",
                        "bio": "Doctor Stephen Strange is a fictional superhero appearing in American comic books published by Marvel Comics. Created by artist Steve Ditko and writer Stan Lee,[1] the character first appeared in Strange Tales #110 (cover-dated July 1963). Doctor Strange serves as the Sorcerer Supreme, the primary protector of Earth against magical and mystical threats. Inspired by stories of black magic and Chandu the Magician, Strange was created during the Silver Age of Comic Books to bring a different kind of character and themes of mysticism to Marvel Comics.",
                        "company": "Avengers Inc."
                    },
                    {
                        "userId": "tchalla",
                        "name": "T'Challa",
                        "email": "tchalla@avengers.org",
                        "bio": "Black Panther is a fictional superhero appearing in American comic books published by Marvel Comics. The character was created by writer-editor Stan Lee and writer-artist Jack Kirby, first appearing in Fantastic Four #52 (cover-dated July 1966) in the Silver Age of Comic Books. Black Panther's real name is T'Challa, king and protector of the fictional African nation of Wakanda. Along with possessing enhanced abilities achieved through ancient Wakandan rituals of drinking the essence of the heart-shaped herb, T'Challa also relies on his proficiency in science, rigorous physical training, hand-to-hand combat skills, and access to wealth and advanced Wakandan technology to combat his enemies.",
                        "company": "Avengers Inc."
                    }
                ];
            case 'trip':
                return [
                    {
                        "tripId": "62f4cc6e-ece1-40ea-a6f4-7605f94ac5a4",
                        "userId": "tonystark",
                        "origin": "3dc84d15-9bd0-4aca-b11a-1aee60c9bb6b",
                        "destination": "cc7f75c2-0d49-4d44-8898-296268d14115",
                        "departureDateTime": "2019-04-06T20:21:42.000Z",
                        "arrivalDateTime": "2019-04-06T21:24:56.000Z",
                        "purpose": "business"
                    },
                    {
                        "tripId": "02ae559c-b583-445c-8b83-283fb60155f5",
                        "userId": "tonystark",
                        "origin": "cc7f75c2-0d49-4d44-8898-296268d14115",
                        "destination": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "departureDateTime": "2019-04-10T04:47:21.000Z",
                        "arrivalDateTime": "2019-04-10T09:13:52.000Z",
                        "purpose": "BUSINESS"
                    },
                    {
                        "tripId": "58f84e4b-be09-494d-9304-ef11f39e8a01",
                        "userId": "tonystark",
                        "origin": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "destination": "3dc84d15-9bd0-4aca-b11a-1aee60c9bb6b",
                        "departureDateTime": "2019-04-11T10:16:24.000Z",
                        "arrivalDateTime": "2019-04-11T11:04:42.000Z",
                        "purpose": "BUSINESS"
                    },
                    {
                        "tripId": "120f4454-76d9-4e18-abbb-93677bc5aff4",
                        "userId": "thorodinson",
                        "origin": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "destination": "ad44274b-685e-4a96-9a76-74bec9894fc0",
                        "departureDateTime": "2019-04-07T22:42:04.000Z",
                        "arrivalDateTime": "2019-04-07T23:14:06.000Z",
                        "purpose": "VACATION"
                    },
                    {
                        "tripId": "643f0a6b-5497-49b5-bc5e-b58f5a16dab2",
                        "userId": "thorodinson",
                        "origin": "ad44274b-685e-4a96-9a76-74bec9894fc0",
                        "destination": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "departureDateTime": "2019-04-09T13:24:32.000Z",
                        "arrivalDateTime": "2019-04-09T16:41:05.000Z",
                        "purpose": "VACATION"
                    },
                    {
                        "tripId": "7c17e904-1d25-407a-9198-db5712dc380a",
                        "userId": "stephenstrange",
                        "origin": "1ac1b418-8543-49ae-b4d8-68034cdd0757",
                        "destination": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "departureDateTime": "2019-04-06T21:24:04.000Z",
                        "arrivalDateTime": "2019-04-07T22:25:14.000Z",
                        "purpose": "BUSINESS"
                    },
                    {
                        "tripId": "7c17e904-1d25-407a-9198-db5712dc380a",
                        "userId": "stephenstrange",
                        "origin": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "destination": "1ac1b418-8543-49ae-b4d8-68034cdd0757",
                        "departureDateTime": "2019-04-10T04:19:52.000Z",
                        "arrivalDateTime": "2019-04-10T05:29:31.000Z",
                        "purpose": "BUSINESS"
                    }
                ];
            case 'place':
                return [
                    {
                        "placeId": "3dc84d15-9bd0-4aca-b11a-1aee60c9bb6b",
                        "name": "Austin, Texas",
                        "zipcode": 78758,
                        "city": "Austin",
                        "state": "Texas",
                        "county": "Lamar",
                        "country": "United States"
                    },
                    {
                        "placeId": "cc7f75c2-0d49-4d44-8898-296268d14115",
                        "name": "Chicago, Illinois",
                        "zipcode": 60007,
                        "city": "Chicago",
                        "state": "Illinois",
                        "county": "Cook",
                        "country": "United States"
                    },
                    {
                        "placeId": "8c42b12a-bfce-449f-aa49-bd256d13d7f1",
                        "name": "San Francisco, California",
                        "zipcode": 94016,
                        "city": "San Francisco",
                        "state": "California",
                        "county": "San Francisco",
                        "country": "United States"
                    },
                    {
                        "placeId": "1ac1b418-8543-49ae-b4d8-68034cdd0757",
                        "name": "Miami, Florida",
                        "zipcode": 33101,
                        "city": "Miami",
                        "state": "Florida",
                        "county": "Miami-Dade",
                        "country": "United States"
                    },
                    {
                        "placeId": "ad44274b-685e-4a96-9a76-74bec9894fc0",
                        "name": "Portland, Oregon",
                        "zipcode": 97035,
                        "city": "Portland",
                        "state": "Oregon",
                        "county": "Multnomah",
                        "country": "United States"
                    }
                ];
            default:
                throw 'unsupported entity type: ' + entityType;
        }

    }

    static nextId() {
        const id = _nextId;
        _nextId = _nextId + 1;
        return id;
    }

}