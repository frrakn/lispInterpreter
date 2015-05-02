var parseDebug = false;

var lispParse = function lispParse(string){
  var arrayStack = [];
  var outputAST = [];
  var elements = string.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').trim().split(/\s+/m);

  if(parseDebug){
    console.log(elements);
  }

  var parseSingleElement = function parseSingleElement(singleElement){
    var parseSingleOutput;
    if(singleElement === 't'){
      parseSingleOutput = true;
    }
    else if(singleElement === 'nil'){
      parseSingleOutput = false;
    }
    else{
      var parsedFloat = parseFloat(singleElement);
      if(!isNaN(parsedFloat)){
        parseSingleOutput = parsedFloat;
      }
      else{
        parseSingleOutput = singleElement;
      }
    }
    
    
    if(parseDebug){
      console.log(singleElement + " parsed to " + parseSingleOutput + " (" + typeof parseSingleOutput + ")");
    }
    
    return parseSingleOutput;
  };

  var currentArray = outputAST;
  var currentElement;
  for(var i = 0; i < elements.length; i++){
    currentElement = elements[i];
    switch(currentElement){
      case '(':
        var newArray = [];
        currentArray.push(newArray);
        arrayStack.push(currentArray);
        currentArray = newArray;
        break;
      case ')':
    currentArray = arrayStack.pop();
    break;
    default:
      currentArray.push(parseSingleElement(currentElement));
      break;
    }
  }

  if(parseDebug){
    console.log(printTree(outputAST, ''));
  }

  return outputAST;
};

var printTree = function printTree(tree, depthString){
  if(tree instanceof Array){
    var output = depthString + '[\n';
    for(var i = 0; i < tree.length; i++){
      output += printTree(tree[i], depthString + '  ') + '\n';
    }
    output += depthString + ']';
    return output;
  }
  else{
    return depthString + tree.toString();
  }
};

var eval = function eval(tree){
  if(tree instanceof Array){
    //  simplify tree[0] if Array
    if(tree[0] instanceof Array){
      tree[0] = eval(tree[0]);
    }
    //  function call
    if(tree[0] in lib){
      for(var i = 1; i < tree.length; i++){
        tree[i] = eval.call(this, tree[i]);
      }
      return lib[tree[0]].apply(undefined, tree.slice(1));
    }
    else if(tree[0] in lib2){
      return lib2[tree[0]](tree.slice(1));
    }
    else if(tree[0] instanceof Function){
      for(var i = 1; i < tree.length; i++){
        tree[i] = eval.call(this, tree[i]);
      }
      return tree[0].apply(undefined, tree.slice(1));
    }
    else{

    }
  }
  else{
    //  single element: string, float, variable
    if(typeof tree === 'string'){
      //  check if variable, dereference
      if(tree[0] !== '"' || tree[tree.lenth-1] !== '"' && tree in this.variables){
        return eval.call(this, this.variables[tree]);
      }
      else{
        //  string literal
        return tree;
      }
    }
    else{
      //  float
      return tree;
    }
  }
};

var lib = {
  '+': function(){
    return Array.prototype.reduce.call(arguments, function(acc, e, i, array){
      return acc + e;
    }, 0);
  },
  'first': function(){
    return arguments[0][0];
  },
  'list': function(){
    return Array.prototype.slice.call(arguments);
  },
  '*': function(){
    return Array.prototype.reduce.call(arguments, function(acc, e, i, array){
      return acc * e;
    }, 1);
  }
};

var variables = {
};

var lib2 = {
  'defparameter': function(){
    variables[arguments[0][0]] = eval.call(this, arguments[0][1]);
    return undefined;
  },
  'defun': function(){
    var argNames = arguments[0][1];
    var evalAST = arguments[0][2];
    lib[arguments[0][0]] = function(){
      var context = {};
      context.variables = Object.create(this.variables);
      for(var i = 0; i < argNames.length; i++){
        context.variables[argNames[i]] = arguments[i];
      }
      return eval.call(context, evalAST);
    }
    return undefined;
  },
  'lambda': function(){
    var argNames = arguments[0][0];
    var evalAST = arguments[0][1];
    return function(){
      var context = {};
      context.variables = Object.create(this.variables);
      for(var i = 0; i < argNames.length; i++){
        context.variables[argNames[i]] = arguments[i];
      }
      return eval.call(context, evalAST);
    };
  }
};
// Test code
var str = '(first (list 1 (+ 2 3) 9)) ((lambda (x) x) "HelloWorld") (defun square (a) (* a a)) ((lambda (x) (+ 6 x)) (square 5))';
var parsed = lispParse(str);
for(var i = 0; i < parsed.length; i++){
  console.log(eval(parsed[i]));
}