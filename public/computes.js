var timer;
var client = {};
client.name=uuid.v1();

socket = io('http://api.computes.io');
socket.connect();
socket.on('connect', function () {
  $('#log').html(client.name + ': Connected <br/>');
  // requestJob();
  socket.on('message', function (msg) {
    // my msg
  });
});

function requestJob(){

  var post={
    url: 'http://api.computes.io/jobs/requestJob',
    form: {
      client: client,
      name_patterns: ['computes']
    },
    auth: { 'kazi-token':'YOUR-SECRET-TOKEN' }
  };

  $('#log').html(client.name +': Requesting new job...<br/>');

  $.ajax({
    method: 'POST',
    url: post.url,
    data: post.form,
    cache: false,
    headers: post.auth
  })
    .done(function( job ) {
      $('#log').html('done'+JSON.stringify(job)+'<br/>');
      if(job){
        // var job=JSON.parse(body);
        if (Object.keys(job).length !== 0){
          $('#log').html(JSON.stringify(job));
        };
        if(!_.isEmpty(job)){
          $('#log').html(client.name +': Job allocated [JOB:'+job.id+']<br/>');

          //crunch job
          runJob(job,function(job){
            $('#log').html(JSON.stringify(job));
          });
        }
        else{
          $('#log').html(client.name +': No jobs...waiting<br/>');

          timer = setTimeout(function(){
            requestJob();
          },1000);
        }
      } else {
        $('#log').html('requestJob timed out<br/>');
        timer = setTimeout(function(){
          requestJob();
        },1000);
      }
    });
}

// runJob
function runJob(job){

  if(job && !_.isUndefined(job.name)){

    var result=job;
    $('#log').html(client.name +': Running job [JOB:'+job.id+']<br/>');

    var terminateJobAfter=job.terminateJobAfter || (5*60*1000); //5 minutes

    timer = setTimeout(function(){
      $('#log').html(client.name +': Forcefully Teminating [JOB:'+job.id+']<br/>' );
      finishJob(job,result);
    },terminateJobAfter);

    var payload = job.data;
    if(payload && (payload.operation || payload.command)){
      var command = payload.command;
      var operation = payload.operation;
      var data = payload.data;
      $('#log').html('> command:'+command+'<br/>');
      $('#log').html('> operation:'+operation+'<br/>');
      $('#log').html('> data:'+data+'<br/>');

      if(operation){
        var test = eval(operation);
        if (data){
          result = test(data);
        } else {
          result = test();
        }
        $('#log').html('operation: ' + JSON.stringify(operation)+'<br/>');
        $('#log').html('data: ' + JSON.stringify(data)+'<br/>');
        $('#log').html('result: ' + JSON.stringify({result:result})+'<br/>');

        result = {result:result};
        finishJob(job,result,function(){

        });
      }
    }
  }
}

// finishJob
function finishJob(job,result,callback){

  callback=callback || function(res){};

  $('#log').html(client.name +': Finishing job...<br/>');

  $.ajax({
    method: 'POST',
    url: 'http://api.computes.io/jobs/finishJobs',
    data: {client:client,jobs:job,result:result},
    cache: false,
    headers: { 'kazi-token':'YOUR-SECRET-TOKEN' }
  })
    .done(function( body ) {
      callback();
      timer = setTimeout(function(){
        requestJob();
      },1000);
    });
};

requestJob();
