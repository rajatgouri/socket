jQuery(()=>{
    $('#back').click(()=>{
        if(window.innerWidth < 766){
            $('#friendId').text('')
            $('#online').show();
            $('#chat_window').hide();
        }
        else{
            $('#friendId').text('')
            $('#poster').show();
            $('#chat_window').hide();
        } 
    })

    $(window).resize(function() { 
        if(window.innerWidth < 766){
            $('#online').show();
            $('#chat_window').hide();
        }
        else{
            $('#online').show();
            $('#chat_window').hide();
            $('#poster').show();

        }
        
    });


    $('#logout').click(()=>{
        $.get('/logout',(data,status)=>{
            window.location.href="/";
        });
    });


    setInterval(()=>{
        $('#online').css('height',window.innerHeight- 120 +"px") ;
        $('#poster').css('height',window.innerHeight- 120 +"px");
        $('#chat_window').css('height',window.innerHeight- 120 +"px");
        if(window.innerWidth < 766){
            $('#container').removeClass('pl-4');
            $('#container').removeClass('pr-4');
        }
        else{
            $('#container').addClass('pl-4');
            $('#container').addClass('pr-4');

        }
    });
})