var socket = undefined;
var oldCode = undefined;

/* When DOM has been loaded */
window.onload = function() {
	socket = io.connect();
	socket.emit("subscribe", "sumorobot");

	/* Aquire all the users */
	socket.on("users", function (users) {
		/* When the online users div does not exist */
		if ($("#online-users") == null) return;
		/* Empty the online users div */
		$("#online-users").html("");
		/* Populate all the online users */
		for (var key in users) {
			$("#online-users").html( $("#online-users").html() + 
			'<div id="'+users[key].name.replace(/ /g, "")+'" class="user" onclick="javascript:getCode(\'' + users[key].email + '\')">' +
			'<a class="mugshot-link" href="#" title="show code">' +
			'<center><img class="mugshot" src="' + users[key].profile.mugshot + '" alt="mugshot" /></center>' +
			'<p>' + users[key].name + '</p><p>points: ' + users[key].profile.points + '</p></a></div>');
		}
	});

	/* Receive the requested users code */
	socket.on("receive-code", function (code) {
		//editor_other.setValue(code);
		//$("#code-message").slideDown("fast")
		//setTimeout(function() { $("#code-message").slideUp("fast"); }, 2000);
	});

	/* Execute in intervals */
	setInterval(function() {
		/* Send ping to keep connection alive */
		socket.emit("ping");
	}, 10000);

	/* MOVE */
    Blockly.Blocks.move = {
        helpUrl: 'http://code.google.com/p/blockly/wiki/Move',
        init: function() {
            this.setHSV(0, 1.00, 0.74);
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(this.VALUES), 'MOVE');
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip("move forward");
        }
    };
    Blockly.Blocks.move.VALUES =
        [['move forward', 'forward'],
        ['move backward', 'backward'],
        ['move right' + ' \u21BB', 'right'],
        ['move left'+ ' \u21BA', 'left'],
        ['move stop', 'stop']];
    Blockly.JavaScript.move = function() {
        var value = this.getFieldValue('MOVE');
        return value + '();\n';
    };

    /* ENEMY */
    Blockly.Blocks.enemy = {
        helpUrl: 'http://code.google.com/p/blockly/wiki/Turn',
        init: function() {
            this.setHSV(200, 1.00, 0.74);
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(this.VALUES), 'ENEMY');
            this.setOutput(true, 'Boolean');
            this.setTooltip("turn left or right");
        }
    };
    Blockly.Blocks.enemy.VALUES =
        [['enemy left', 'LEFT'],
        ['enemy right', 'RIGHT'],
        ['enemy front', 'FRONT']];
    Blockly.JavaScript.enemy = function() {
        var value = this.getFieldValue('ENEMY');
        return [value, Blockly.JavaScript.ORDER_ATOMIC];
    };

    /* LINE */
    Blockly.Blocks.line = {
        helpUrl: 'http://code.google.com/p/blockly/wiki/Turn',
        init: function() {
            this.setHSV(50, 1.00, 0.74);
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(this.VALUES), 'LINE');
            this.setOutput(true, 'Boolean');
            this.setTooltip("turn left or right");
        }
    };
    Blockly.Blocks.line.VALUES =
        [['line left', 'LEFT'],
        ['line right', 'RIGHT'],
        ['line front', 'FRONT']];
    Blockly.JavaScript.line = function() {
        var value = this.getFieldValue('LINE');
        return [value, Blockly.JavaScript.ORDER_ATOMIC];
    };
    Blockly.inject(document.getElementById('blocklyDiv'), {
        path: "/javascripts/blockly/",
        trashcan: true,
        toolbox: '<xml id="toolbox" style="display: none;">' +
            '<block type="controls_if"></block>' +
            '<block type="move"><title name="MOVE">forward</title></block>' +
            '<block type="enemy"><title name="ENEMY">FRONT</title></block>' +
            '<block type="line"><title name="LINE">FRONT</title></block></xml>'
    });
}

/* Send the code */
function sendCode() {
	socket.emit("send-sumorobot-code", Blockly.JavaScript.workspaceToCode());
}

/* Get a users code */
function getCode(userEmail) {
	socket.emit("get-code", "sumorobot", userEmail);
}

/* Show the code */
function showCode() {
	alert(Blockly.JavaScript.workspaceToCode());
}
