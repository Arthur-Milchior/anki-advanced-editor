var originalFields = [];

function onFocusTex(elem) {
    /*
       Called when focus is set to the field `elem`.

       If the field is not changed, nothing occurs.
       Otherwise, set currentField value, warns python of it.
       Change buttons.
       If the change is note made by mouse, then move caret to end of field, and move the window to show the field.

     */
    var previousCurrentField = currentField;
    currentField = elem;
    var ord = currentFieldOrdinal()
    var field = originalFields[ord];
    if (field !== null) {
        elem.innerHTML = field;
        originalFields[ord] = null;
    }
    if (previousCurrentField === elem) {
        // anki window refocused; current element unchanged
        return;
    }
    pycmd("focus:" + ord);
    enableButtons();
    // don't adjust cursor on mouse clicks
    if (mouseDown) {
        return;
    }
    // do this twice so that there's no flicker on newer versions
    caretToEnd();
    // scroll if bottom of element off the screen
    function pos(obj) {
        var cur = 0;
        do {
            cur += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return cur;
    }

    var y = pos(elem);
    if ((window.pageYOffset + window.innerHeight) < (y + elem.offsetHeight) ||
        window.pageYOffset > y) {
        window.scroll(0, y + elem.offsetHeight - window.innerHeight);
    }
}

function changeSize(fieldNumber){
    saveNow(true);
    pycmd("toggleLineAlone:"+fieldNumber);
}

function toggleFroze(fieldNumber){
    saveNow(true);
    pycmd("toggleFroze:"+fieldNumber);
}

function createDiv(ord,  fieldContent, nbCol){
    return "<td colspan={2}><div id='f{0}' onkeydown='onKey(window.event);' oninput='onInput();' onmouseup='onKey(window.event);'  onfocus='onFocusTex(this);' onblur='onBlur();' class='field clearfix' ondragover='onDragOver(this);' onpaste='onPaste(this);' oncopy='onCutOrCopy(this);' oncut='onCutOrCopy(this);' contentEditable=true class=field>{1}</div></td>".format(ord, fieldContent, nbCol);
}

function createNameTd(ord, fieldName, nbColThisField, nbColTotal, sticky, imgFrozen, imgUnfrozen){
    img = sticky?imgFrozen:imgUnfrozen;
    title = (sticky?"Unf":"F") + "reeze field " + fieldName;
    txt = "<td class='fname' colspan={0}><span>{1}</span>".format(nbColThisField, fieldName);
    if (nbColTotal>1){
        txt+= "<input type='button' value='Change size' tabIndex='-1' onClick='changeSize({0})'/>".format(ord);
    }
    txt+="<img width='15px' height='15px' title='{0}' src='{1}' onClick='toggleFroze({2})'/></td>".format(title, img, ord);
    return txt;
}

function currentFieldOrdinalAux() {
    if (currentField) {
        return currentField.id.substring(1);
    } else {
        return null;
    }
}

function setField(ord, fieldValue, fieldValueTexProcessed) {
    var currentOrd = currentFieldOrdinalAux();
    if (currentOrd == ord) {
        return;
    }
    if (!fieldValue) {
        fieldValue = "<br>";
    }
    originalFields[ord] = fieldValue;
    if (!fieldValueTexProcessed) {
        fieldValueTexProcessed = "<br>";
    }
    field = $("#f"+ord);
    field.html(fieldValueTexProcessed);

}

function setFieldsMC(fields, nbCol, imgFrozen, imgUnfrozen) {
    //console.log("Set fields with "+nbCol+" columns")
    /*Replace #fields by the HTML to show the list of fields to edit.
      Potentially change buttons

      fields -- a list of fields, as (name of the field, current value, whether it has its own line)
      nbCol -- number of colum*/
    var txt = "";
    originalFields = [];
    var width = 100/nbCol;
    var partialNames = "";
    var partialFields = "";
    var lengthLine = 0;
    for (var i = 0; i < fields.length; i++) {
        var fieldName = fields[i][0];
        var alone = fields[i][3];
        var sticky = fields[i][4];
        var fieldContent = fields[i][1];
        if (!fieldContent) {
            fieldContent = "<br>";
        }
        originalFields[i] = fieldContent;
        var fieldContentTex = fields[i][2];
        if (!fieldContentTex) {
            fieldContentTex = "<br>";
        }
        //console.log("fieldName: "+fieldName+", fieldContent: "+fieldContent+", alone: "+alone);
        nbColThisField = (alone)?nbCol:1;
        fieldContentHtml = createDiv(i, fieldContentTex, nbColThisField);
        fieldNameHtml = createNameTd(i, fieldName, nbColThisField, nbCol, sticky, imgFrozen, imgUnfrozen)
        if (alone){
            nameTd = fieldNameHtml
            txt += "<tr>"+fieldNameHtml+"</tr><tr>"+fieldContentHtml+"</tr>";
        }else{
            lengthLine++;
            partialNames += fieldNameHtml
            partialFields += fieldContentHtml
        }
        //When a line is full, or last field, append it to txt.
        if (lengthLine == nbCol || ( i == fields.length -1 && lengthLine>0)){
            txt+= "<tr>"+partialNames+"</tr>";
            partialNames = "";
            txt+= "<tr>"+partialFields+"</tr>";
            partialFields = "";
            lengthLine = 0;
        }
    }
    $("#fields").html("<table cellpadding=0 width=100% style='table-layout: fixed;'>" + txt + "</table>");
    maybeDisableButtons();
}
