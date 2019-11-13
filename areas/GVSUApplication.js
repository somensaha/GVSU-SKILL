const allFuctions = require('../functions');

const GVSUApplication = {
    canHandle(handlerInput) {
        // console.log("GVSUApplication::",handlerInput.requestEnvelope.request.intent.name);
        // console.log("type::",handlerInput.requestEnvelope.request.type);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
            && handlerInput.requestEnvelope.request.intent.name === 'GVSUApplication';
    },
    handle(handlerInput) {
        console.log("GVSUApplication Handler:: ", handlerInput);
        const currentIntent = handlerInput.requestEnvelope.request.intent;
        // var serviceType = handlerInput.requestEnvelope.request.intent.slots.searchphrase;
        var serviceType = allFuctions.getSlotValue(handlerInput);

        console.log("GVSUApplication Handler:: currentIntent::" +currentIntent.name+" serviceType::" +serviceType);

        if (typeof serviceType != 'undefined' && serviceType != null) {
            serviceType = serviceType.toLowerCase();
            serviceType = serviceType.trim();
            serviceType = serviceType.replace(/\s|\.|\-/g, '');
            return allFuctions.slotForAllWhatIs(handlerInput, serviceType);
            // myResult = await this.stringSimilarityfn(serviceType.value);
			// 	console.log('dbSpeechwithSlotForAllWhatIs::bestMatchedAnswer ==> ', myResult);
        } else {
            var obj = {
                speechText: allFuctions.noValueReturned,
                displayText: allFuctions.noValueReturned,
                repromptSpeechText: allFuctions.listenspeech
            }
            return allFuctions.formSpeech(handlerInput, obj);
        }
    }
}

module.exports = [
    GVSUApplication
];