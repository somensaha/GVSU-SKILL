const allFuctions = require('../functions');

const AllStaticIntents = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
        && 
            (
            handlerInput.requestEnvelope.request.intent.name === 'ForgetPassword'
            || handlerInput.requestEnvelope.request.intent.name === 'GVSUEmergency'
            || handlerInput.requestEnvelope.request.intent.name === 'GVSUPrinting'
            || handlerInput.requestEnvelope.request.intent.name === 'GVSUEmergencyAbroad'
            || handlerInput.requestEnvelope.request.intent.name === 'GVSUParking'
            || handlerInput.requestEnvelope.request.intent.name === 'ComputerIssues'
            || handlerInput.requestEnvelope.request.intent.name === 'FinancialAidApplicationDeadline'
            || handlerInput.requestEnvelope.request.intent.name === 'FinancialAidApplicationTime'
        );
    },
    handle(handlerInput) {
        console.log("AllStaticIntents handler::");
        return allFuctions.setDynamoParams(handlerInput);
    }
}

module.exports = [ AllStaticIntents ];