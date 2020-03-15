var LinedTextArea = function(parentWrapper) {
    var cssTable = 'padding:0px 0px 0px 0px!important; margin:0px 0px 0px 0px!important; font-size:1px;line-height:0px; width:100%; height: 100%;';
    var cssTd1 = 'border:1px #345 solid; border-right:0px; vertical-align:top; width:1px;';
    var cssTd2 = 'border:1px #345 solid; border-left:0px; vertical-align:top;';
    var cssButton = 'width:120px; height:40px; border:1px solid #333 !important; border-bottom-color: #484!important; color:#ffe; background-color:#222;';
    var cssCanvas = 'border:0px; margin-top:0px; padding-top:0px;';
    var cssTextArea =  'width:100%; height: 100%;'
                //    + 'height:500px;'
                //    + 'font-size:14px;'
                    + 'font-family:monospace;'
                    + 'line-height:18px;'
                    // + 'font-weight:500;'
                    + 'margin: 0px 0px 0px 0px;'
                    + 'padding: 0px 0px 0px 0px;'
                    + 'resize: both;'
                //    + 'color:#ffa;'
                    + 'border:0px;'
                //    + 'background-color:#222;'
                    + 'white-space:nowrap; overflow:auto;'                    
                    // supported only in opera 12.x
                    + 'scrollbar-arrow-color: #ee8;'
                    + 'scrollbar-base-color: #444;'
                    + 'scrollbar-track-color: #666;'
                    + 'scrollbar-face-color: #444;'
                    + 'scrollbar-3dlight-color: #444;' /* outer light */
                    + 'scrollbar-highlight-color: #666;' /* inner light */
                    + 'scrollbar-darkshadow-color: #444;' /* outer dark */
                    + 'scrollbar-shadow-color: #222;' /* inner dark */
                    ;

    // LAYOUT (table 2 panels)
    var table = document.createElement('table');
    table.setAttribute('cellspacing','0');
    table.setAttribute('cellpadding','0');
    table.setAttribute('style', cssTable);

    var tr = document.createElement('tr');

    var td1 = document.createElement('td');
    td1.setAttribute('style', cssTd1);

    var td2 = document.createElement('td');
    td2.setAttribute('style', cssTd2);

    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);

    // TEXTAREA
    var ta = this.evalnode = document.createElement('textarea');
    ta.setAttribute('cols','80');
    ta.setAttribute('style', cssTextArea);
    //ta.value = this.S.get('eval') || '';  // get previous executed value ;)

    // TEXTAREA NUMBERS (Canvas)
    var canvas = document.createElement('canvas');
    canvas.width = 48;    // must not set width & height in css !!!
    canvas.height = "100%";  // must not set width & height in css !!!
    canvas.setAttribute('style', cssCanvas);
    ta.canvasLines = canvas;
    td1.appendChild(canvas);
    td2.appendChild(ta);

    const lineHeight = 18;
    // PAINT LINE NUMBERS
    ta.paintLineNumbers = function() {
    
        try {
            var canvas = this.canvasLines;

            // on resize
            if (canvas.height != this.clientHeight) {
                canvas.height = this.clientHeight; 
            }
        
            var ctx = canvas.getContext("2d");
            // prepare for redrawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ctx.fillStyle = "#303030";
            // ctx.fillStyle = '#2e134a94';
            // ctx.globalAlpha = 0.58;
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, 48, this.scrollHeight+1);
            ctx.fillStyle = "#BBB";
            ctx.font = "14px monospace"; // NOTICE: must match TextArea font-size and line-height
            // ctx.globalAlpha = 1;
            var startIndex = Math.floor(this.scrollTop / lineHeight,0);
            var endIndex = startIndex + Math.ceil(this.clientHeight / lineHeight,0);

            for (var i = startIndex; i < endIndex; i++){
                var ph = 10 - this.scrollTop + (i*lineHeight);
                var text = ''+(1+i);  // line number
                ctx.fillText(text,40-(text.length*6),ph);
            }

        } catch(e){ 
            console.warn(e);
        }
      };

      ta.onscroll     = function(ev){ this.paintLineNumbers(); };
      ta.onmousedown  = function(ev){ this.mouseisdown = true; }
      ta.onmouseup    = function(ev){ this.mouseisdown=false; this.paintLineNumbers(); };
      ta.onmousemove  = function(ev){ if (this.mouseisdown) this.paintLineNumbers(); };
      

	parentWrapper.appendChild(table);
    // make sure it's painted
	ta.paintLineNumbers();
    return ta;
};