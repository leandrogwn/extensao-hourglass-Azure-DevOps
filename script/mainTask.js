VSS.init({
  explicitNotifyLoaded: true,
  usePlatformScripts: true,
  usePlatformStyles: true
});

VSS.require([
  "VSS/Service",
  "TFS/WorkItemTracking/RestClient",
  "TFS/WorkItemTracking/Contracts",
  "VSS/Authentication/Services"],
  function (VSS_Service, TFS_Wit_WebApi, _Contracts, AuthenticationService) {
    //organizar isso abaixo
      var collectionUri = VSS.getWebContext().collection.uri;
      var collectionId = VSS.getWebContext().collection.id;
      var projectId = VSS.getWebContext().project.id;
      var userName = VSS.getWebContext().user.name;
      var userEmail = VSS.getWebContext().user.email;
      uriTask = collectionUri + "web/wi.aspx?pcguid=" + collectionId + "&id=";

      // Recupera o cliente REST de Rastreamento de Item de Trabalho
      var witClient = VSS_Service.getCollectionClient(TFS_Wit_WebApi.WorkItemTrackingHttpClient);
      
      // Constante de consulta contendo a consulta WIQL
      var query = {
        query: "SELECT [System.Id] FROM WorkItem WHERE [System.AssignedTo] = '" + userName + "'  AND [System.WorkItemType] = 'Task' AND [System.State] NOT IN ('Closed','Completed','Resolved','Removed', 'Done', 'To Do')"
      };

      // Exemplo url PBI https://linxfarma.visualstudio.com/web/wi.aspx?pcguid=c73370ed-b12c-46f8-be36-4d3323b1a831&id=502
      //https://linxfarma.visualstudio.com/Softpharma%20-%20Sustenta%C3%A7%C3%A3o/_apis/wit/workitems?ids=188&$expand=relations&api-version=4.1

      // Executa a consulta WIQL no projeto ativo
      witClient.queryByWiql(query, projectId).then(function (result) {
        if (result.workItems.length > 0) {

          // Gera matriz de todos os IDs de itens de trabalho abertos
          var openWorkItems = result.workItems.map(function (wi) { return wi.id });

          witClient.getWorkItems(openWorkItems, null, null, _Contracts.WorkItemExpand.Relations).then(function (workItems) {
            var mwa = workItems.map(function (w) {
              return [
                w.fields["System.TeamProject"],
                w.fields["System.IterationPath"],
                w.relations["0"].url,
                w.id,
                w.fields["System.Title"],
                w.fields["System.State"],
                w.fields["System.AreaPath"],
                w.fields["System.AssignedTo"]
              ];
            });
            console.log(mwa);
            mwa.unshift(["Projeto", "Sprint", "PBI", "Tarefa", "Titulo", "Estado","Time", ""]);  
            tabela(mwa);
            if (localStorage.tarefa) {
              changeTitle(localStorage.getItem('tarefa'), localStorage.getItem('titulo'));
            }
          });
        } else {
          document.getElementById("tabela").innerHTML = "Ola " + userName + ", você não possui tarefas em progresso atribuídas a sua conta VSTS.";
        };
        VSS.notifyLoadSucceeded();
        
      });

      function tabela(conteudo) {

        // Obter a referência para o corpo
        var divTBody = document.getElementById("tabela");

        // Cria um elemento <table> e um elemento <tbody>
        var tbl = document.createElement("table");
        tbl.setAttribute("class", "table table-hover");
        var thead = document.createElement("thead");
        var tblBody = document.createElement("tbody");

        var thd = function (i) { return (i == 0) ? "th" : "td"; };

        // Criando todas as células
        for (var j = 0; j < conteudo.length; j++) {

          // Cria uma linha na tabela
          var row = document.createElement("tr");

          for (var i = 0; i < conteudo[j].length; i++) {

            // Cria elemento th ou td
            var cell = document.createElement(thd(j));

            // Valida tipo de informação e trata conforme o necessário
            // j == 0 -> Cabeçalho tabela
            // i == 0 -> Coluna id task
            // i == 5 -> Coluna id pbi
            // i == 7 -> Coluna botão task
            if (i == 3 && j > 0) {
              var cellText = linkTask(uriTask + conteudo[j][i], conteudo[j][i]);
            } else if (i == 2 && j > 0) {
              var codPbi = getLastCodUrl(conteudo[j][2]);
              var linkPbi = collectionUri + "web/wi.aspx?pcguid=" + collectionId + "&id=" + codPbi;
              var cellText = linkTask(linkPbi, codPbi);
            }else if (i == 1 && j > 0){
              var codSprt = getSprint(conteudo[j][1])
              var cellText = document.createTextNode(codSprt);
            }else if (i == 6 && j > 0){
              var time = getSprint(conteudo[j][6])
              var cellText = document.createTextNode(time);
            }else if (i == 7 && j > 0) {
              var codPbii = getLastCodUrl(conteudo[j][2]);
              var codSprt = getSprint(conteudo[j][1])
              var cellText = createButton(conteudo[j][3], conteudo[j][4], codPbii, conteudo[j][0], codSprt, conteudo[j][6]);
            } else {
              var cellText = document.createTextNode(conteudo[j][i]);
            }

            // Acrescenta conteúdo a celula da tabela
            cell.appendChild(cellText);
            row.appendChild(cell);
          }

          // Acrescenta linha ao final do corpo da tabela
          (j == 0) ? thead.appendChild(row) : tblBody.appendChild(row);
        }

        // Acrescenta o <thead / tbody> no <table>
        tbl.appendChild(thead);
        tbl.appendChild(tblBody);

        // Acrescenta <table> em <body>
        divTBody.appendChild(tbl);
      }

      function getLastCodUrl(url) {
        var urlIndex = url.lastIndexOf("/");
        var codPbi = url.substring(urlIndex + 1);
        return codPbi;
      }

      function getSprint(sprint) {
        var sprt = sprint.lastIndexOf("\\");
        var codSprint = sprint.substring(sprt + 1);
        return codSprint;
      }

      // Criar botao recebendo cod tarefa e titulo
      function createButton(tarefa, titulo, codPbi, projeto, sprint, time) {
        var btn = document.createElement("button");
        btn.setAttribute("id", "btn_" + tarefa);
        btn.setAttribute("name", "btnHourglass");
        btn.setAttribute("class", "btn btn-success bowtie-icon bowtie-status-run");
        btn.addEventListener("click", function () {
          if (localStorage.getItem('tarefa') != null) {
            saveAzure();
            stopTimer();
            resetTitle();
            resetButtons();
          }
          storageTime(tarefa, titulo, codPbi, projeto, sprint, time);
          changeTitle(tarefa, titulo);
        });
        return btn;
      }

      // Converter ISO para Date / Não ta sendo usado
      // 2018-10-10T19:12:18.51Z -> 10/10/2018
      function formatDate(str) {
        var date = moment(str);
        var dateComponent = date.utc().format('DD/MM/YYYY HH:mm');
        return dateComponent;
      }

      // Oculta info e tira texto
      function resetTitle() {
        document.getElementById("info").style = "display:none;";
        document.getElementById("p-info").innerHTML = "";
        document.getElementById("linkTask").innerHTML = "";
      }

      // Grava informação locais no navegador
      function storageTime(tarefa, titulo, codPbi, projeto, sprint, time) {
        localStorage.setItem("tarefa", tarefa);
        localStorage.setItem("titulo", titulo);
        localStorage.setItem("codPbi", codPbi);
        localStorage.setItem("projeto", projeto);
        localStorage.setItem("sprint", sprint);
        localStorage.setItem("horaInicio", dateTimeNow());
        localStorage.setItem("time", time);
      }

      // Altera titulo e cria botão de acordo com a task selecionada
      function changeTitle(tarefa, titulo) {
        var lt = uriTask + tarefa;

        document.getElementById("info").style = "display:flex-inline;";
        document.getElementById("p-info").innerHTML = tarefa + " - " + titulo;

        document.getElementById("linkTask").appendChild(linkTask(lt, "Abrir TASK " + tarefa));

        // Cria div para o botão stop
        var btnStop = document.getElementById('btn-stop-task')
        btnStop.addEventListener("click", function () {
          saveAzure();
          updateEsforcoReal(tarefa);
          stopTimer();
          resetTitle();
          resetButtons();
        });
        startTimer();
        changeButton(tarefa);
      }

      //Update Field Esforço real 
      function updateEsforcoReal(tarefa){
        // Gera matriz de todos os IDs de itens de trabalho abertos
        var id = tarefa;
        var hI = localStorage.getItem('horaInicio');
        witClient.getWorkItem(id, ["Custom.LinxEsforcoReal"]).then(
          function (workItem) {
          if(workItem.fields["Custom.LinxEsforcoReal"] == null){
            var esforcoAtual = 0;
          }else{
            var esforcoAtual = workItem.fields["Custom.LinxEsforcoReal"];
          }
          
         
          console.log("Esforço Atual: " + esforcoAtual);

          var diferenca = tempoDecimal(hI, dateTimeNow());
          
          var esforcoReal = parseFloat(esforcoAtual) + parseFloat(diferenca);
          
          var retorno = esforcoReal.toFixed(2).split(".");
          var esforcoReal = retorno[0] +","+ retorno[1];
                
          var update = [
            {
              "op": "add",
              "path": "/fields/Custom.LinxEsforcoReal",
              "value": esforcoReal
            },
            {
              "op": "add",
              "path": "/fields/System.History",
              "value": "Adicionado "+diferenca +"h na tarefa "+ id +"."
            }
          ];
  
          try{
            witClient.updateWorkItem(update, id).then((workItem) => {
            console.log('WorkItem Updated: ' + workItem.id);
            });
          }catch(e) {
            console.error('Work item (${workItem.id}) update error: ${e}')
          }
        });  
      }

      //Calcula diferença de tempo entre datas e retorna data convertida para decimal.
      function tempoDecimal(dataInicial, dataFinal){
        var dtFinal  = dataFinal;
        var dtInicial = dataInicial;

        var ms = moment(dtFinal,"YYYY-MM-DD HH:mm:ss").diff(moment(dtInicial,"YYYY-MM-DD HH:mm:ss"));
        var d = moment.duration(ms);
        var s = Math.floor(d.asHours());
        return parseFloat(s) + parseFloat( (moment.utc(ms).format("mm")/60).toFixed(2));
      }

      // Grava informações com chamada de serviço
      // Model Tramite
      // TramiteID,OrigemTramite,Email,Projeto,Pbi,Tarefa,Titulo,HoraInicio,HoraFim,Obs,TramiteEditado
      function saveAzure() {

        var sendInfo = {
          origemTramite: true,
          tramiteEditado: false,
          time: localStorage.getItem('time'),
          email: userEmail,
          projeto: localStorage.getItem('projeto'),
          sprint: localStorage.getItem('sprint'),
          pbi: localStorage.getItem('codPbi'),
          tarefa: localStorage.getItem('tarefa'),
          titulo: localStorage.getItem('titulo'),
          horaInicio: localStorage.getItem('horaInicio'),
          horaFim: dateTimeNow(),
          obs: localStorage.getItem('obs')
        }

        var settings = {
          "async": true,
          "crossDomain": true,
          "url": "https://hourglassazure.azurewebsites.net/api/apitramites",
          "type": "POST",
          "headers": {
            "cache-control": "max-age=0"
          },
          "processData": false,
          "contentType": "application/json; charset=utf-8", 
          "dataType": "json", 
          "data": JSON.stringify(sendInfo)
        }

        $.ajax(settings).done(function (response) {
          console.log("Done: " + response);
        });
      }

      // Criar formato Datetime
      function dateTimeNow() {
        var date = new Date();

        var hours = date.getHours();
        hours = hours < 10 ? '0' + hours : hours;

        var minutes = date.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;

        var seconds = date.getSeconds();
        seconds = seconds < 10 ? '0' + seconds : seconds;

        var strTime = hours + ':' + minutes + ':' + seconds;

        var dia = date.getDate();
        dia = dia < 10 ? '0' + dia : dia;

        var mes = date.getMonth() + 1;
        mes = mes < 10 ? '0' + mes : mes;
        return date.getFullYear() + "-" + mes + "-" + dia  + "T" + strTime;
      }

      // Cria link para o código da task ou pbi
      function linkTask(lt, text) {
        var linkTask = document.createElement("a", text);
        linkTask.setAttribute("href", lt);
        linkTask.setAttribute("target", "_top");
        textoTask = document.createTextNode(text);
        linkTask.appendChild(textoTask);
        return linkTask;
      }

      // Reseta todos os botões das tasks e altera o da task selecionada como inativo
      function changeButton(tarefa) {
        resetButtons();
        document.getElementById("btn_" + tarefa).className = "btn bowtie-icon bowtie-file-type-coffeescript";
        document.getElementById('btn_' + tarefa).disabled = true;
      }

      // Reseta todos os botões das tasks e altera todos como ativo
      function resetButtons() {
        var a = document.getElementsByName("btnHourglass");
        for (var i = 0; i < a.length; i++) {
          a[i].className = "btn btn-success bowtie-icon bowtie-status-run";
          a[i].removeAttribute("disabled");
        }
      }
  });