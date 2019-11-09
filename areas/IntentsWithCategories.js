const allFuctions = require('../functions');

const IntentsWithCategories = {
    canHandle(handlerInput) {
        // console.log("IntentsWithCategories::",handlerInput.requestEnvelope.request.intent.name);
        // console.log("type::",handlerInput.requestEnvelope.request.type);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
            && handlerInput.requestEnvelope.request.intent.name === 'IntentsWithCategories';
    },
    handle(handlerInput) {
        console.log("IntentsWithCategories Handler:: ", handlerInput);
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        // var serviceType = handlerInput.requestEnvelope.request.intent.slots.searchphrase;
        var serviceType = allFuctions.getSlotValue(handlerInput);

        var obj = {
            speechText: this.noValueReturned,
            displayText: this.noValueReturned,
            repromptSpeechText: this.listenspeech
        }

        return allFuctions.suggestionsFromJson({utterance: serviceType}).then((suggestions) => {
            suggestions = suggestions.slice(0,5);
            obj = {
                speechText: 'I can assist you with the queries like: '+ suggestions.join(', \n '),
                displayText: 'I can assist you with the queries like: '+ suggestions.join(', \n '),
                repromptSpeechText: this.listenspeech,
                sessionEnd: false
            }
            return allFuctions.formSpeech(handlerInput, obj)
        });
    }
}

module.exports = [
    IntentsWithCategories
];