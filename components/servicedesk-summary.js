'use strict';

const MAX_TITLE_LENGTH = 40;

polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    // only supported value right now is 1
    maxTicketsToDisplay: 1,
    shortTitle: Ember.computed('details', function () {
        let shortTitle = this.get('details.0.title');
        if (shortTitle.length < MAX_TITLE_LENGTH) {
            return shortTitle;
        } else {
            return shortTitle.slice(0, MAX_TITLE_LENGTH) + '...';
        }
    }),
    additionalTicketCount: Ember.computed('details', function () {
        if (this.get('details.length') > this.get('maxTicketsToDisplay')) {
            return this.get('details.length') - this.get('maxTicketsToDisplay');
        } else {
            return 0;
        }
    }),
    hasResponse: Ember.computed('details', function () {
        return this.get('details.0.respondedtime') !== "0";
    }),
    additionalTicketsHaveResponse: Ember.computed('details.length', function () {
        let details = this.get('details');

        // skip first index because the first index is already being displayed as a unique tag
        // with its ticket number and response status.  This value is only for the additional tickets.
        for(let i=1; i<details.length; i++){
            if (details[i].respondedtime !== "0") {
                return true;
            }
        }

        return false;
    })
});

