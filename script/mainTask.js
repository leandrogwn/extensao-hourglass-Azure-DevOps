VSS.init({
  explicitNotifyLoaded: true,
  usePlatformScripts: true,
  usePlatformStyles: true
});

VSS.require(["VSS/Service", "TFS/WorkItemTracking/RestClient", "VSS/Controls", "VSS/Controls/Grids"], function (VSS_Service, TFS_Wit_WebApi, Controls, Grids) {
  var projectId = VSS.getWebContext().project.id;
  var userName = VSS.getWebContext().user.name;

  // Retrieves the Work Item Tracking REST client
  var witClient = VSS_Service.getCollectionClient(TFS_Wit_WebApi.WorkItemTrackingHttpClient);
  // Query object containing the WIQL query
  var query = {
    query: "SELECT [System.Id] FROM WorkItem WHERE [System.AssignedTo] = '" + userName + "' AND [System.State] NOT IN ('Closed','Completed','Resolved','Removed', 'Done')"
  };

  // Executes the WIQL query against the active project
  witClient.queryByWiql(query, projectId).then(function (result) {

    // Generate an array of all open work item ID's
    var openWorkItems = result.workItems.map(function (wi) { return wi.id });
    var fields = [
      "System.Title",
      "System.State",
      "Microsoft.VSTS.Common.StateChangeDate",
      "System.AssignedTo"];
    witClient.getWorkItems(openWorkItems, fields).then(function (workItems) {
      var mwa = workItems.map(function (w) {
        return [
          w.id,
          w.fields["System.Title"],
          w.fields["System.State"],
          w.fields["Microsoft.VSTS.Common.StateChangeDate"],
          w.fields["System.AssignedTo"]];
      });

      mwa.unshift(["Id", "Titulo", "Estado", "Ultima Alteração", "Assinado"]);
      function criarTabela(conteudo) {
        var tabela = document.createElement("table");
        var thead = document.createElement("thead");
        var tbody = document.createElement("tbody");
        var thd = function (i) { return (i == 0) ? "th" : "td"; };
        for (var i = 0; i < conteudo.length; i++) {
          var tr = document.createElement("tr");
          for (var o = 0; o < conteudo[i].length; o++) {
            var t = document.createElement(thd(i));
            if (o == 0 && i > 0) {
              var texto = document.createTextNode("<a href=\"#\">"+conteudo[i][o]+"</a>");
            } else {
              var texto = document.createTextNode(conteudo[i][o]);
            }
            t.appendChild(texto);
            tr.appendChild(t);
          }
          (i == 0) ? thead.appendChild(tr) : tbody.appendChild(tr);
        }
        tabela.appendChild(thead);
        tabela.appendChild(tbody);
        return tabela;
      }

      document.getElementById("titulo").innerHTML = "Hourglass - Gerir Tempo";
      document.getElementById("tabela").appendChild(criarTabela(mwa));

      VSS.notifyLoadSucceeded();
    });
  });
});
