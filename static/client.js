// Client-side javascript for the checkers game
// Everything is wrapped into an anonymous function.

(function() {
  var socket  = io();
  var id;

  // Initialize the board and pieces when the page is loaded
  $(function() {
    $("#quit").hide();
    $("#reset").hide();
    $('#message').hide();
    $(".whiteTurn").hide();
    $(".blackTurn").hide();
    $("#chat").hide();

    var room ="abc";

      socket.emit('join', {roomID:room});

    socket.on('leave', function(socket){
      //prompt.html('the oppnent has left.');
      alert('the oppnent has left.');
    });

    socket.on('onePlayer', function(data){
      alert('You need another player to start the game!');
      $('#start').attr('disabled', true);
    });

    socket.on('twoPlayer', function(data){
      alert('Two players connected, you can now start the game!');
      $('#start').attr('disabled', false);
    });

    socket.on('full', function(data){
      alert('Two players already connected, you cannot join!');
      $('#start').attr('disabled', true);
    });

    var message = document.getElementById("newMessage");
    var handle = document.getElementById("handle");
    var btn = document.getElementById("send");
    var output = document.getElementById("output");

    // emit event
    btn.addEventListener('click', function(){
      socket.emit('chat', {
        handle: handle.value,
        message: newMessage.value
      })
    })

    // Listen for event
    socket.on('chat', function(data){
      output.innerHTML += '<p><strong>' + data.handle + ":"+ data.message + "</strong></p>"
    })

    $("#start").on("click", function(){
      $(this).hide();
      createBoard();
      createPieces();
      $("#quit").show();
      $("#chat").show();

    });

    $("#quit").on("click", function(){

      socket.emit('canQuit',{quit: true});

      console.log("canQuit has been emitted");

    });


    socket.on('quit', function(data){
      gameOver();
      $("#message").text("Someone quitted the game!");
    });

    $("#reset").on("click", function(){

      window.location.reload();

    });

  });

  function gameOver(){
    $("#quit").hide();
    $("#board").hide();
    $("#message").show();
    $("#reset").show();
    $(".whiteTurn").hide();
    $(".blackTurn").hide();
    $("#chat").hide();
  }





//-----------------------------------------------------------------------------------------
  // 1. Creating the rows and columns for the checkers board
  // 2. Creating the background colour of the board

  function createBoard(){

    $(".whiteTurn").fadeIn();
    //$(".whiteTurn").hide();

    for (var i=0;i<8;i++){
      $("#board").append('<tr row="'+i+'"></tr>');
      for (var j=0;j<8;j++){
        var color = "white";
        if ((i+j)%2 == 0){color = "black"};
        $('#board tr[row='+i+']').append('<td class="cell '+color+'" row="'+i+'" col="'+j+'"></td>');
      }
    }
  }

  //-----------------------------------------------------------------------------------------
  // 1. Creating the pieces on the board.
  // 2. Assigning a div class to each colour and already add the class for a king when it is changed.
  // 3. Assigning an individual id to each piece on the board.
  // 4. Enable the pieces to be dragged over the board by using .draggable of jQuery

  function createPieces(){

    for (var i=0;i<4;i++){
      for (var j=0;j<3;j++){
        $('#board [col='+(i*2+(j%2))+'][row='+j+']').append('<div class="piece white"><div class="kingCenter">&#9812;</div></div>');
        $('#board [col='+(i*2+((j+1)%2))+'][row='+(7-j)+']').append('<div class="piece black"><div class="kingCenter">&#9812;</div></div>');
        if (j <= 3) {
        $.each($('#board div.piece'), function(idx){
         $(this).attr('id','' + parseInt(idx +1));
        });
        }
      }
    }

    $(".piece").draggable({
      containment: "#board",
      cursor:"move",
      start: validCells,
      stop: removeValid,
      revert: true
    });

  //$( ".piece white").draggable("disable");
  $(".piece.white").draggable("disable");

  }

//-----------------------------------------------------------------------------------------
  // 1. Allow the pieces only to be moved one way for now.
  // 2. Set the movement for black and white pieces

  function validCells (event, ui){

    let row=parseInt($(this).parent().attr("row"));
    let col=parseInt($(this).parent().attr("col"));

    id = $(this).attr("id");
    console.log("id"+id);
    //move forward for black checkers       //move forward for white checkers
    var forward=-1;
    var color = "black";
    if($(this).hasClass("white")){
      forward=1;
      color = "white";
    }
    piece = $(this);
    checkCells(piece,row,col,forward,color,0);

  };

  //-----------------------------------------------------------------------------------------
  // 1. Enable the king piece to move both up and down on the board.

  function checkCells(piece,row,col,forward,color,twice){
    if (piece.hasClass("king")){
      markValidCell(row,col,1,forward*-1,color,twice);//right cell
      markValidCell(row,col,-1,forward*-1,color,twice);//left cell
    }
    markValidCell(row,col,1,forward,color,twice);//right cell
    markValidCell(row,col,-1,forward,color,twice);//left cell
  }

  //-----------------------------------------------------------------------------------------
  // 1. Provide all the necessary parameters in order to accept a valid cell.
  // 2. Take into account that a double step can be taken.
  // 3. Enable the pieces to be dropped by using .droppable of jQuery.

  function markValidCell(row,col,step,forward,color,twice){

    if ($('.cell[row='+(row+forward)+'][col='+(col+step)+'] .piece').length > 0){
      if (!$('.cell[row='+(row+forward)+'][col='+(col+step)+'] .piece').hasClass(color)){
        if ($('.cell[row='+(row+forward*2)+'][col='+(col+step*2)+'] .piece').length == 0){
          $(".cell[row="+(row+forward*2)+"][col="+(col+step*2)+"]").addClass("validCell");
        }
      }
    }
    else if (twice == 0){
      $('.cell[row='+(row+forward)+'][col='+(col+step)+']').addClass('validCell');
    }
    $(".validCell").droppable({
      accept: ".piece",
      hoverClass: "drop-hover",
      drop: dropPiece,
    });
  }

  //-----------------------------------------------------------------------------------------
 // 1. Enable pieces to be dropped.
 // 2. Generating the old location (row, col), new location (row, col) and id to send to the server.
 // 3. socket receiving data
 // 4. socket remove piece
 // 5. socket add king

  function dropPiece (event,ui){



    let oldRow=parseInt(ui.draggable.parent().attr("row"));

    let oldCol=parseInt(ui.draggable.parent().attr("col"));

    let newRow=parseInt($(this).attr("row"));

    let newCol=parseInt($(this).attr("col"));

    console.log("oldrow: " + oldRow + ", oldcol: " + oldCol);

    console.log("newrow: " + newRow + ", newcol: " + newCol);

    var color = "black";

    if (ui.draggable.hasClass("white")){color = "white";}

    socket.emit('takeTurn',{turn: color});

    console.log("takeTurn has been emitted");

    if(Math.abs(newRow-oldRow)==2|| Math.abs(oldCol-newCol) == 2){
      socket.emit('canEat',
      { pieceId:id,
        x1: oldRow,
        y1: oldCol,
        x2: newRow,
        y2: newCol,
        turn: color,
        canEat: true
       });
      console.log("canEat has been emitted");

      // eatPiece(ui.draggable,color,oldRow,oldCol,newRow,newCol);
    } else{
      socket.emit('canMove',
      { pieceId:id,
        x1: oldRow,
        y1: oldCol,
        x2: newRow,
        y2: newCol
       });
     console.log("canMove has been emitted");
    }


    // add functionality for king
    if (newRow == 0||newRow == 7){

      socket.emit('canKing',
      { pieceId:id,
        x1: oldRow,
        y1: oldCol,
        x2: newRow,
        y2: newCol,
        turn: color
      });
      console.log("canKing has been emitted");
    }


  }


//receive message from server
socket.on('knownTurn', function(data){
  console.log("knownTurn has been received");
  console.log(data);

  $(".piece").draggable({
    containment: "#board",
    cursor:"move",
    start: validCells,
    stop: removeValid,
    revert: true
  });

if(data.turn=="white"){
  $(".blackTurn").fadeOut();
  $(".whiteTurn").fadeIn();
}else{
  $(".blackTurn").fadeIn();
  $(".whiteTurn").fadeOut();
}

  if($(".validCell").length==0){
    if(data.turn=="white"){
      $(".piece.white").draggable("disable");
      $(".piece.black").draggable("enable");

    }else{
      $(".piece.black").draggable("disable");
      $(".piece.white").draggable("enable");

    }
  }else{
    $(".piece").draggable("disable");
    //ui.draggable.draggable("enable");
  }
});


  socket.on('move',function(data){
    removeValid();

    console.log("move has been received");
    console.log(data);
    movePiece(data);

  });

  socket.on('eat', function(data){
    removeValid();

    console.log("eat has been received");
    console.log(data);

    var piece=$('.cell[row='+data.x1+'][col='+data.y1+'] .piece');
    eatPiece(piece,data.turn,data.x1,data.y1,data.x2,data.y2);

    movePiece(data)

  });

  socket.on('king', function(data){
    console.log("king has been received");
    console.log(data);

    $("#board").find(".piece[id='" + data.pieceId + "']").addClass("king");

    //$('.cell[row='+data.x2+'][col='+data.y2+'] .piece').addClass("king");

  })

  socket.on('win', function(data){
    announceWinner(data.winner);
    console.log("win has been emitted");
  });


  function movePiece(data) {
    var isKing = $('.cell[row='+data.x1+'][col='+data.y1+'] .piece').hasClass('king');
    $('.cell[row='+data.x1+'][col='+data.y1+'] .piece').remove();
    if(data.pieceId<13){
      $('#board [row='+data.x2+'][col='+data.y2+']').append('<div class="piece white"><div class="kingCenter">&#9812;</div></div>');
      $('.cell[row='+data.x2+'][col='+data.y2+'] .piece').attr('id', data.pieceId).addClass(isKing?'king':'');

    }else{
      $('#board [row='+data.x2+'][col='+data.y2+']').append('<div class="piece black"><div class="kingCenter">&#9812;</div></div>');
      $('.cell[row='+data.x2+'][col='+data.y2+'] .piece').attr('id', data.pieceId).addClass(isKing?'king':'');

    }
  }

  //-----------------------------------------------------------------------------------------
  // 1. Allow pieces to be hit and removed from the board.
  // 2. Initialize function for announcing the winner if there are no pieces left from one side.

  function eatPiece(piece, color, oldRow, oldCol, newRow, newCol){
    $('.cell[row='+(oldRow+(newRow-oldRow)/2)+'][col='+(oldCol+(newCol-oldCol)/2)+'] .piece').remove();

    checkCells(piece,newRow,newCol,(newCol-oldCol)/2,color,1);

    if ($('.piece').length - $('.piece.'+color).length == 0){
      socket.emit('canWin', {winner: color});
      console.log("canWin has been emitted");
      }
  }

  //-----------------------------------------------------------------------------------------

  function removeValid(event, ui){
    $(".validCell").droppable("destroy");
    $(".validCell").removeClass("validCell");

  }
  //-----------------------------------------------------------------------------------------
  // Display who has won this game.

  function announceWinner(color){
    $('#message').show();
    $('#reset').show();
    if (color == 'black'){$('#message').text('Black has won the game!');}
    else{$('#message').text('White has won the game!');}

    $('.piece').draggable('disable');
  }


}());
