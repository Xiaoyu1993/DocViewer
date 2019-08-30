// global variables
var hoverHighlight = 'rgba(232, 138, 12, 1)';
var transGraphColor = 'rgba(123, 123, 123, 0.2)';
var prevClickedRow = '';
var isRowClicked = false;
var graphNum = 0; // the number of graphs in the canvas now

//jQuery
$("document").ready(function() {
  //submit click function
  $('#loadGraphFileBtn').on('click', function () {
      var text = $('#graphFile1').val().replace("C:\\fakepath\\", "");

      if (text != "") {
        // create canvas
        $("#graphCanvas")
          .append('<div class="col svgGroup"> \
                      <div class="row"> \
                          <div class="col" align="center"> \
                              <svg id="svgCircles' + graphNum + '" class="svgCircles"></svg> \
                          </div> \
                          <div class="col col-lg-2" id="transGraphContent"> \
                            <svg id="svgTrans' + graphNum + '" class="svgTrans"></svg> \
                          </div> \
                      </div> \
                  </div>');

        //send data to the server
        var data = {};
        data['filename'] = text;

        $.post("/loadGraph",data,
        function(jsonData,status){
            console.log(jsonData);
            try {
              // draw bubble treemap
              let svg1 = d3.select("#svgCircles"+graphNum);
              svg1.selectAll("*").remove();
              jsonData["hierarchy"].children.sort((a,b) => (a.name > b.name ? 1 : -1));
              drawChart(jsonData["hierarchy"], svg1);
            }
            catch(error) {
              console.error(error);
            }

            try {
              // draw transcript view
              let svgTrans = d3.select("#svgTrans"+graphNum);
              drawTrans(jsonData["sentences"], svgTrans);
            }
            catch(error) {
              console.error(error);
            }

            graphNum++;
        },"json");
      }
  });

  $('#loadTextFileBtn').on('click', function () {
    var text1 = $('#textFile').val().replace("C:\\fakepath\\", "");

    if (text1 != "") {
      // create new canvas
      $("#graphCanvas")
        .append('<div class="col svgGroup"> \
                    <div class="row"> \
                        <div class="col" id="circleRow' + graphNum + '"> \
                            <div id="loader' + graphNum + '"> \
                              <div class="loader"></div> \
                              <h2>Processing...</h2> \
                            </div> \
                        </div> \
                        <div class="col col-lg-2" id="transGraphContent"> \
                            <svg id="svgTrans' + graphNum + '" class="svgTrans"></svg> \
                        </div> \
                    </div> \
                </div>');

    //send data to the server
      var data = {};
      data['filename'] = text1;
      
      $.post("/loadText",data,
      function(jsonData, status){
          console.log(jsonData)
          try {
            // draw bubble treemap
            $("#loader"+graphNum).remove();
            $("#circleRow"+graphNum).append('<svg id="svgCircles' + graphNum + '" class="svgCircles"></svg>');
            let svgCircles= d3.select("#svgCircles"+graphNum);
            svgCircles.selectAll("*").remove();
            jsonData["hierarchy"].children.sort((a,b) => (a.name > b.name ? 1 : -1));
            drawChart(jsonData["hierarchy"], svgCircles);
          }
          catch(error) {
            console.error(error);
          }

          try {
            // draw transcript view
            let svgTrans = d3.select("#svgTrans"+graphNum);
            console.log(svgTrans);
            drawTrans(jsonData["sentences"], svgTrans);
          }
          catch(error) {
            console.error(error);
          }

          graphNum++;
      },"json");
    }
});
  
  // toggle sidebar
  $('#sidebarButton').on('click', function () {
    $('#sidebar').toggleClass('active');
  });

  // show selected file name
  $('.custom-file-input').change(function (e) {
    $(this).next('.custom-file-label').html(e.target.files[0].name);

  $('#showTransBtn').on('click', function() {
    d3.selectAll('#transGraphContent')
      .classed('col col-lg-2', true);

    d3.selectAll(".svgTrans")
      .style("width", "100%");

    $(this).text("Show transcript ✔");
    $('#hideTransBtn').text(" Hide transcript");
  });

  $('#hideTransBtn').on('click', function() {
    d3.selectAll('transGraphContent')
      .classed('col col-lg-2', false);

    d3.selectAll(".svgTrans")
      .style("width", "0px");

    $(this).text("Hide transcript ✔");
    $('#showTransBtn').text(" Show transcript");
  });
});

});

function drawChart(data, svg) {
    // Create hierarchy.
    let root = d3.hierarchy(data)
        .sum(function(d) { return Math.sqrt(d.size) *10; }) // For flare.
        //.sum(function(d) { return d.size*3; })
        .sort(function(a, b) { return b.value - a.value; });

    // Create bubbletreemap.
    let bubbletreemap = d3.bubbletreemap()
        .padding(7)
        .curvature(10)
        .hierarchyRoot(root)
        .width(svg.attr("width"))
        .height(svg.attr("height"))
        .colormap(["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"]); // Color brewer: 12-class Paired

    // Do layout and coloring.
    let hierarchyRoot = bubbletreemap.doLayout().doColoring().hierarchyRoot();

    let leafNodes = hierarchyRoot.descendants().filter(function (candidate) {
        return !candidate.children;
    });

    let zoom = d3.zoom()
    //.scale(1.0)
    //.scaleExtent([1, 5])
    .on("zoom", function () {
      svg.attr("transform", d3.event.transform)    
    });
    svg.call(zoom);

    // Draw contour.
    let contourGroup = svg.append("g")
        .attr("class", "contour")
        .style('transform', 'translate(50%, 50%)');

    path = contourGroup.selectAll("path")
        .data(bubbletreemap.getContour())
        .enter().append("path")
        .attr("id", function(d) { return "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1).replace(/%/g, '');})
        .attr("d", function(arc) { return arc.d; })
        .style("stroke", "black")
        .style("stroke-width", function(arc) { return arc.strokeWidth; })
        .style("fill-opacity", 0.0) 
        .style("fill", "white")
        .attr("transform", function(arc) {return arc.transform;})
        .on("mouseover", function(d, i) {
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            .style("fill-opacity", 0.8) 
            .style("fill", "#b3b3b3")
            .style("stroke-width", function(arc) { return arc.strokeWidth*2; });
            
            labelText = d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1);
            // Specify where to put label of text
            contourGroup.append("text")
                .attr("id", "ct" + "-" + i)
                .attr("x", 300)
                .attr("y", 50)
                .attr("dy", ".35em")
                .style("fill", "black")
                .text(labelText); 
        })
        .on("mouseout", function(d, i) {
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            .style("fill-opacity", 0.0) 
            .style("fill", "white")
            .style("stroke-width", function(arc) { return arc.strokeWidth; });

            d3.select("#ct" + "-" + i).remove();  // Remove text location
        });
        

    // Draw circles.
    let circleGroup = svg.append("g")
        .attr("class", "circlesAfterPlanck")
        .style('transform', 'translate(50%, 50%)');

    circleGroup.selectAll("circle")
        .data(leafNodes)
        .enter().append("circle")
        .attr("id", function(d) { return "e-" + d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1).replace(/%/g, '');})
        .attr("r", function(d) { return d.r; })
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .style("fill", function(d) { return d.color; })
        //.style("fill-opacity", 0.7)
        //.style("stroke", "black")
        //.style("stroke-width", "1")
        .on("mouseover", function(d, i) {
            // Use D3 to select element, change size
           /* d3.select(this)
            //.attr("r", d.r*1.1)
            .style("fill", d3.rgb(d.color).darker(0.8));*/
            
            d3.selectAll("#"+this.id)
            //d3.select(this)
            .style("fill", d3.rgb(d.color).darker(1));
            
            labelText = d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1);
            // Specify where to put label of text
            circleGroup.append("rect")
                .attr("id", "r" + "-" + i)
                .attr("x", d.x+10)
                .attr("y", d.y-15)
                .attr("width", 12 * labelText.length)
                .attr("height", 30)
                .attr("cornerRadius", 3)
                .attr("fill", "white"); 

            circleGroup.append("text")
                .attr("id", "t" + "-" + i)
                .attr("x", d.x+20)
                .attr("y", d.y)
                .attr("dy", ".35em")
                .style("fill", "black")
                .text(labelText );                     
        })
        .on("mouseout", function(d, i) {
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            //d3.select(this)
            .style("fill", d.color);
            
            // Select text by id and then remove
            d3.select("#t" + "-" + i).remove();  // Remove text location
            d3.select("#r" + "-" + i).remove();  // Remove text location
        });

    /*
    // Draw labels.
    let textGroup = svg.append("g")
        .attr("class", "text");

    textGroup.selectAll("text")
        .data(leafNodes)
        .enter().append("text")
        .attr("font-size", "12px")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text(function(d) { return d.data.name; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    */
}

function drawTrans(senList, svg, speakerDiff=0) {
  svg.selectAll("*").remove();

  var w = $("#transGraphContent").width();
  var h = $("#transGraphContent").height();

  var docLength = senList.length;
  var transcriptScale = d3.scaleLinear()
                          .domain([0, docLength])
                          .range([0, h]);
  var constantHeight = 0;
  var maxTranLine = 0

  // to normalize the widths of the lines of text, need to find
  // the maximum length
  for (i=0; i<senList.length;i++){
    if (maxTranLine < senList[i].text.length){
      maxTranLine =senList[i].text.length;
    }
  }

  // create and store data object for visualization
  var graphData = [];
  for (i=0; i < senList.length; i++){
    var d = {};
    // var ySec = hmsToSec(captionArray[i][0]);
    var ySec = i;
    d.timeStamp = ySec;
    var yloc = transcriptScale(ySec);
    d.y = yloc;
    //d.speaker = captionArray[i][2];
    if (speakerDiff === 0){
      d.x = 0;
      d.fillColor = transGraphColor;
      d.width = senList[i].text.length/maxTranLine * w;
      // d.width = w;
    } else {
      var speakerIndex = speakerList.indexOf(captionArray[i][2]);
      if (speakerIndex === -1){
        // uncomment the below to show other speakers as well
        // (apart from the participants)
        /*
        d.y = transScaleY(speakerList.length - 5);
        d.fillColor = transGraphColor;
        d.height = transScaleY(0.9);
        */
      } else {
        d.x = transScaleX(speakerList.length - speakerIndex - 1);
        d.fillColor = speakerColors[speakerIndex];
        d.width = transScaleX(0.9);
      }
    }
    if (constantHeight !== 0){
      d.height = 10;
    } else {
      // var endSec = hmsToSec(captionArray[i][1]);
      var endSec = i+1;
      d.endTime = endSec;
      // var startSec = hmsToSec(captionArray[i][0]);
      var startSec = i;
      var scaledHeight = transcriptScale(endSec - startSec);
      if (scaledHeight < 1){
        d.height = 1;
      } else {
        d.height = scaledHeight;
      };
    }
    d.sentence = senList[i].text;
    /*if ( (!($.isEmptyObject(textMetadataObj))) && 
         (showIC) ) {
      d.fillColor = icColorArray[i];
    }*/
    graphData.push(d);
  }

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .direction('w');
  svg.call(tip);

  var rects = svg.selectAll("rect")
  .data(graphData).enter()
  .append("rect")
  .attr("x", function (d) { return d.x; })
  .attr("y", function (d) { return d.y; })
  .attr("width", function (d) { return d.width; })
  .attr("z", 1)
  .attr("height", function (d) { return d.height; })
  .attr("fill", d.fillColor)
  .on("mouseover", function(d, i){
    tip.html("<font size=5 color='#fff'>"+
        i +":  </font>"+d.sentence).show();
    d3.select(this).attr("height", 5);
    //if ((prevClickedTag === "") && !(isRowClicked)){
      d3.select(this).attr('fill', hoverHighlight);
    //}
    d3.select(this).attr('z', 50);
    /*$("#transTable tr").eq(i).children().last()
                        .addClass("hoverHighlight");*/
  })
  .on("mouseout", function(d){
    tip.hide();
    d3.select(this).attr("height", d.height);
    //if ((prevClickedTag === "") && !(isRowClicked)){
      d3.select(this).attr('fill', d.fillColor);
    //}
    d3.select(this).attr('z', 1);
    /*$("#transTable").find("td").removeClass("hoverHighlight");*/
  });

  var fisheye = d3.fisheye.circular().radius(100);
    svg.on('mousemove', function(){
        // implementing fisheye distortion
        fisheye.focus(d3.mouse(this));
        rects.each(function(d) { d.fisheye = fisheye(d); })
             .attr("y", function(d) { return d.fisheye.y; })
             .attr("width", function(d) {
                return d.width * d.fisheye.z;
             })
             .attr("height", function(d) { 
               return d.height * d.fisheye.z; 
             });
    });
    svg.on('mouseleave', function(){
        rects.each(function(d){d.fisheye = fisheye(d);})
             .attr("y", function(d){return d.y;})
             .attr("width", function(d){return d.width;})
             .attr("height", function(d){return d.height;});
    });

}

function generateTransGraph(transGraphContainer, rawCaptionArray, speakerList, speakerDiff, listOfLowerCaseLines, textMetadataObj, showIC) {
    
    captionArray = removeEmptyLines(rawCaptionArray);
    d3.select(transGraphContainer).selectAll("svg").remove();
    var w = $(transGraphContainer).width();
    // docLength = hmsToSec(captionArray[captionArray.length-1][0]);
    docLength = captionArray.length;
    var h = $(transGraphContainer).height();
    var transSvg = d3.select(transGraphContainer).append("svg")
                     .attr("width", w)
                     .attr("height", h);
    var transcriptScale = d3.scale.linear()
                            .domain([0, docLength])
                            .range([0, h]);
    var transScaleX = d3.scale.linear()
                              .domain([0, speakerList.length])
                              .range([0, w]);
    var transGraphPadding = 0;
    var scaleHeights = 0;
    var constantHeight = 0;
    var maxTranLine = 0

    // to normalize the widths of the lines of text, need to find
    // the maximum length
    for (i=0; i<listOfLowerCaseLines.length;i++){
      if (maxTranLine < listOfLowerCaseLines[i].length){
        maxTranLine = listOfLowerCaseLines[i].length;
      }
    }

    // perform infocontent-based coloring if applicable
    var highestInfoContent = 0;
    var icColorArray = [];
    if ( (!($.isEmptyObject(textMetadataObj))) && 
         (showIC) ) {
      for (word in textMetadataObj) {
        wordic = textMetadataObj[word]["infoContent"];
        if (wordic > highestInfoContent) {
          highestInfoContent = wordic;
        }
      }
      var icScale = d3.scale.pow(2)
                            .domain([0, highestInfoContent])
                            .range([0, 0.3]);
      for (var sInd=0;sInd<listOfLowerCaseLines.length;sInd++){
        var wordsInLine = listOfLowerCaseLines[sInd];
        var maxIC = 0;
        for (var wordInd=0;wordInd<wordsInLine.length;wordInd++){
          var tempIC = 0;
          lookupWord = wordsInLine[wordInd];
          lookupWord = lookupWord.replace(/[^a-zA-Z0-9\-]/g, "");
          if (lookupWord in textMetadata){
            tempIC = textMetadataObj[lookupWord]["infoContent"];
            if (tempIC > maxIC){
              maxIC = tempIC;
            } 
          } else {
            // nothing, this was for testing
          }
        }
        var icLineColor = "rgba(8,69,148," + icScale(maxIC) + ")";
        icColorArray.push(icLineColor);
      }
    }

    // create and store data object for visualization
    var graphData = [];
    for (i=0; i < captionArray.length; i++){
      var d = {};
      // var ySec = hmsToSec(captionArray[i][0]);
      var ySec = i;
      d.timeStamp = ySec;
      var yloc = transcriptScale(ySec);
      d.y = yloc;
      d.speaker = captionArray[i][2];
      if (speakerDiff === 0){
        d.x = 0;
        d.fillColor = transGraphColor;
        d.width = listOfLowerCaseLines[i].length/maxTranLine * w;
        // d.width = w;
      } else {
        var speakerIndex = speakerList.indexOf(captionArray[i][2]);
        if (speakerIndex === -1){
          // uncomment the below to show other speakers as well
          // (apart from the participants)
          /*
          d.y = transScaleY(speakerList.length - 5);
          d.fillColor = transGraphColor;
          d.height = transScaleY(0.9);
          */
        } else {
          d.x = transScaleX(speakerList.length - speakerIndex - 1);
          d.fillColor = speakerColors[speakerIndex];
          d.width = transScaleX(0.9);
        }
      }
      if (constantHeight !== 0){
        d.height = 1;
      } else {
        // var endSec = hmsToSec(captionArray[i][1]);
        var endSec = i+1;
        d.endTime = endSec;
        // var startSec = hmsToSec(captionArray[i][0]);
        var startSec = i;
        var scaledHeight = transcriptScale(endSec - startSec);
        if (scaledHeight < 1){
          d.height = 1;
        } else {
          d.height = scaledHeight;
        };
      }
      d.dialog = captionArray[i][3];
      if ( (!($.isEmptyObject(textMetadataObj))) && 
           (showIC) ) {
        d.fillColor = icColorArray[i];
      }
      graphData.push(d);
    }

    var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([0, 0])
                .direction('e');
    transSvg.call(tip);
    var rects = transSvg.selectAll("rect")
             .data(graphData).enter()
             .append("rect")
             .attr("x", function (d) { return d.x; })
             .attr("y", function (d) { return d.y; })
             .attr("width", function (d) { return d.width; })
             .attr("z", 1)
             .attr("height", function (d) { return d.height; })
             .attr("fill", d.fillColor)
             .on("mouseover", function(d, i){
               tip.html("<font size=2 color='#fff'>"+
                   d.speaker+":  </font>"+d.dialog).show();
               // d3.select(this).attr("height", 5);
               if ((prevClickedTag === "") && !(isRowClicked)){
                 d3.select(this).attr('fill', hoverHighlight);
               }
               d3.select(this).attr('z', 50);
               $("#transTable tr").eq(i).children().last()
                                  .addClass("hoverHighlight");
             })
             .on("mouseout", function(d){
               tip.hide();
               // d3.select(this).attr("height", d.height);
               if ((prevClickedTag === "") && !(isRowClicked)){
                 d3.select(this).attr('fill', d.fillColor);
               }
               d3.select(this).attr('z', 1);
               $("#transTable").find("td").removeClass("hoverHighlight");
             });

    var fisheye = d3.fisheye.circular().radius(100);
    transSvg.on('mousemove', function(){
        // implementing fisheye distortion
        fisheye.focus(d3.mouse(this));
        rects.each(function(d) { d.fisheye = fisheye(d); })
             .attr("y", function(d) { return d.fisheye.y; })
             .attr("width", function(d) {
                return d.width * d.fisheye.z;
             })
             .attr("height", function(d) { 
               return d.height * d.fisheye.z; 
             });
    });
    transSvg.on('mouseleave', function(){
        rects.each(function(d){d.fisheye = fisheye(d);})
             .attr("y", function(d){return d.y;})
             .attr("width", function(d){return d.width;})
             .attr("height", function(d){return d.height;});
    });

    d3.select(transGraphContainer)
      .selectAll('svg')
      .selectAll('rect')
      .on('click', function (d) {
      if (d3.event.ctrlKey || d3.event.metaKey){
        cTime =  new Date();
        var tempTime = cTime.getHours() + ":" +
                      cTime.getMinutes() + ":" +
                      cTime.getSeconds();
        clickLog.push([tempTime, "transGraphWordCloud\n"]);
        sendClickData.data = clickLog;
        $.post("/clicklog", sendClickData, function (data, error) { });
        // if a speaker's transcript timeline is ctrl-clicked,
        // show a word cloud based on only that speaker's utterances
      } else {
        var graphIndex = $(transGraphContainer+' svg')
                          .children('rect')
                          .index(this);
        var captionStartTimeMin = captionArray[graphIndex][0]
        captionStartTimeSec = hmsToSec(captionStartTimeMin);

        // send log to server
        cTime =  new Date();
        var tempTime = cTime.getHours() + ":" +
                      cTime.getMinutes() + ":" +
                      cTime.getSeconds();
        clickLog.push([tempTime, "transGraph",
                      captionStartTimeSec + "\n"]);
        sendClickData.data = clickLog;
        $.post("/clicklog", sendClickData, function (data, error) { });

        // add hhighlight to the transcript, and scroll to the
        // corresponding line
        var transClickItem = $('#transTable tr').eq(graphIndex)
                                                .children().last();
        transClickItem.addClass('hoverHighlight');
        // this small snippet below to scroll the transcript to show
        // the line corresponding to the item selected in transgraph
        if (graphIndex > 3){
          scrollIndex = graphIndex-1;
        } else {
          scrollIndex = 0;
        }
        var transScrollItem = $('#transTable tr')
                                  .eq(scrollIndex)
                                  .children().last();
        $('#transContent').scrollTo($(transScrollItem),
                                    {duration: 'slow',
                                    transition: 'ease-in-out'});
      }
    });
    return graphData;
}

// abadoned
function doIt(fileName1, fileName2 = null) {
  let svg1 = d3.select("#svgCircles1");

  d3.json(fileName1 + "?nocache=" + (new Date()).getTime(), function (error, data1) {
      data1.children.sort((a,b) => (a.name > b.name ? 1 : -1));
      drawChart(data1, svg1);
      
      if(fileName2) {
          let svg2 = d3.select("#svgCircles2");
          d3.json(fileName2 + "?nocache=" + (new Date()).getTime(), function (error, data2) {
              data2.children.sort((a,b) => (a.name > b.name ? 1 : -1));

              // put the element of data2 at the same position as in data
              children_modified = new Array(data2.children.length).fill(null);
              children_left = []
              data2.children.forEach(element => {
                  index = data1.children.findIndex(child => child.name == element.name)
                  if (index != -1 && index<data2.children.length)    
                      children_modified[index] = element;
                  else
                      children_left.push(element);
              });
              children_left.forEach(element => {
                  index = children_modified.findIndex(child => !child);
                  children_modified[index] = element;
              });
              data2.children = children_modified;

              drawChart(data2, svg2);
          });
      }
  });
}