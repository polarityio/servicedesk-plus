'use strict';

const MAX_TITLE_LENGTH = 40;

polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    // only supported value right now is 1
    maxTicketsToDisplay: 1,
    shortTitle: Ember.computed('details', function(){
        let shortTitle = this.get('details.0.title');
        if(shortTitle.length < MAX_TITLE_LENGTH){
            return shortTitle;
        }else{
            return shortTitle.slice(0, MAX_TITLE_LENGTH) + '...';
        }
    }),
    additionalTicketCount: Ember.computed('details', function(){
        if(this.get('details.length') > this.get('maxTicketsToDisplay')){
            return this.get('details.length') - this.get('maxTicketsToDisplay');
        }else{
            return 0;
        }
    }),
});

