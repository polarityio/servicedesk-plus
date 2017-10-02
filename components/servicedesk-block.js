polarity.export = PolarityComponent.extend({
    details: Ember.computed.alias('block.data.details'),
    maxTicketsToDisplay: 5,
    additionalTicketCount: Ember.computed('details', function(){
        if(this.get('details.length') > this.get('maxTicketsToDisplay')){
            return this.get('details.length') - this.get('maxTicketsToDisplay');
        }else{
            return 0;
        }
    }),
    enrichedDetails: Ember.computed('details', function(){
        this.get('details').forEach(function(item){
            item.createdTimeNumeric = parseInt(item.createdtime, 10);
            item.resolvedTimeNumeric = parseInt(item.resolvedtime, 10);
            item.workorderUrl =  item.url + '/WorkOrder.do?woMode=viewWO&woID=' + item.workorderid + '&&fromListView=true';
            item.fullName = item.first_name + ' ' + item.middle_name + ' ' + item.last_name;
            item.hasResponse = item.respondedtime === "0" ? false : true;
        });

        return this.get('details');
    })
});
