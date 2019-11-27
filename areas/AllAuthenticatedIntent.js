const allFuctions = require('../functions');
// const demoAnswerJSON = require('./../demoAnswer.json');

const REALIntents = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (
                handlerInput.requestEnvelope.request.intent.name === 'MyAdvisorsLocation'
                || handlerInput.requestEnvelope.request.intent.name === 'MyAdvisors'
                || handlerInput.requestEnvelope.request.intent.name === 'NextClassTimeReal'
                || handlerInput.requestEnvelope.request.intent.name === 'NextClassLocationReal'
                || handlerInput.requestEnvelope.request.intent.name === 'GeneralInstructorReal'
                || handlerInput.requestEnvelope.request.intent.name === 'GeneralInstructorContactInfoReal'
                || handlerInput.requestEnvelope.request.intent.name === 'MyAdvisorsPhoneNo'
            )
    }, handle(handlerInput) {



        // return allFuctions.linkUser(handlerInput).then((userdata) => {

            console.log("AllAuthenticated Handler:: ", handlerInput);
            const currentIntent = handlerInput.requestEnvelope.request.intent;
            
            // var serviceType = handlerInput.requestEnvelope.request.intent.slots.searchphrase;
            var serviceType = allFuctions.getSlotValue(handlerInput);

            console.log("AllAuthenticated Handler:: currentIntent::" +currentIntent.name+" serviceType::" +serviceType);

            if (typeof serviceType != 'undefined' && serviceType != null) {
                serviceType = serviceType.toLowerCase();
                serviceType = serviceType.trim();
                serviceType = serviceType.replace(/\s|\.|\-/g, '');
                return allFuctions.slotForRealTime(handlerInput, serviceType);
            } else {
                var obj = {
                    speechText: allFuctions.noValueReturned,
                    displayText: allFuctions.noValueReturned,
                    repromptSpeechText: allFuctions.listenspeech
                }
                return allFuctions.formSpeech(handlerInput, obj);
            }
        // });
    }
}

module.exports = [
    REALIntents
];