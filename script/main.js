VSS.require([
    "VSS/Service",
    "TFS/WorkItemTracking/RestClient",
    "TFS/WorkItemTracking/Contracts"],
    function (VSS_Service, TFS_Wit_WebApi, _Contracts) {

        // Get a WIT client to make REST calls to VSTS
        return VSS_Service.getCollectionClient(TFS_Wit_WebApi.WorkItemTrackingHttpClient).
            getWorkItem(503, null, null, _Contracts.WorkItemExpand.Relations).
            then(
                //Successful retrieval of workItems
                function (workItems) {
                    $('#myText').text(JSON.stringify(workItems));
                    console.log(workItems);
                    // Use the widget helper and return success as Widget Status
                });
    });