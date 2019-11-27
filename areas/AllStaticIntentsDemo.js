const allFuctions = require('../functions');

const AllStaticIntents = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' 
        && 
            (
                handlerInput.requestEnvelope.request.intent.name === 'OverallGPAReal'
                || handlerInput.requestEnvelope.request.intent.name === 'StudentAccountBalanceReal'
                || handlerInput.requestEnvelope.request.intent.name === 'StudentFAFSAReal'
                || handlerInput.requestEnvelope.request.intent.name === 'StudentLibraryFeesReal'
                || handlerInput.requestEnvelope.request.intent.name === 'StudentFinancialAwardReal'

        );
    },
    handle(handlerInput) {
        console.log("AllStaticIntents handler::");
        return allFuctions.setDynamoParamsReal(handlerInput);
    }
}

module.exports = [ AllStaticIntents ];