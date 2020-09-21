var parameters = {
    target: '#graph',
    data: [],
    width: 500,
    height: 370,
    grid: true,
    yAxis: {
        domain: [-6, 6]
    },
    xAxis: {
        domain: [-6, 6]
    }
};

const contour_colors = [
    "#000080",
    "#0000ff",
    "#0063ff",
    "#00d4ff",
    "#4effa9",
    "#a9ff4e",
    "#ffe600",
    "#ff7d00",
    "#ff1400",
    "#800000"
];

const colors = ['darkred', 'darkgreen', 'darkcyan', 'goldenrod', 'hotpink', 
                'saddlebrown', 'darkslateblue'];

var diff = nerdamer.diff

function plot_event(event) {
    if (event.keyCode === 13) {
        plot();
    }
}

function parse_function(f) {
    f = f.replace(/pi/g, 3.1415);
    f = f.replace(/[e]/g, 2.7182);
    f = f.replace(/(xy)/g, 'x*y');
    f = f.replace(/(x y)/g, 'x*y');
    f = f.replace(/(yx)/g, 'x*y');
    f = f.replace(/(y x)/g, 'x*y');
    return f
}

function clean(){
    parameters.data = [];
    document.querySelector("#results").innerHTML = "";
    document.querySelector("#graph").innerHTML = "";
    document.querySelector("#exec-time").innerHTML = "";
}

function get_iteration_text(x_value, y_value, z_value, i, iteration_color){
    return get_text(x_value, y_value, z_value, iteration_color, `Iteration ${i + 1}`);
}

function get_text(x_value, y_value, z_value, iteration_color, text){
    var iteration_text = `<span class="option--results__iteration" style="color: ${iteration_color}">${text}: </span>`;
    return `${iteration_text} x=${x_value} y=${y_value} f(x)=${z_value} <br>`;
}


function create_function(fun, color, alpha) {
    return {
        'fn': fun,
        'color': color,
        'graphType': 'polyline',
        'attr': {
            'opacity': alpha
        }
    };
}

function create_graph_object(points, color, alpha, type) {
    return {
        'points': points,
        'fnType': 'points',
        'graphType': type,
        'color': color,
        'attr': {
            'r': 2,
            'opacity': alpha
        }
    };
}

function create_points(points, color, alpha) {
    return create_graph_object(points, color, alpha, 'scatter');
}

function create_segment(points, color, alpha) {
    return create_graph_object(points, color, alpha, 'polyline');
}

function nabla_vector(fun, evaluate_point) {
    return nerdamer.matrix(
        diff(fun, 'x').evaluate(evaluate_point),
        diff(fun, 'y').evaluate(evaluate_point)
    );
}

function hessian_matrix(fun, evaluate_point) {
    return nerdamer.matrix(
        [diff(diff(fun, 'x'), 'x').evaluate(evaluate_point), diff(diff(fun, 'x'), 'y').evaluate(evaluate_point)],
        [diff(diff(fun, 'y'), 'x').evaluate(evaluate_point), diff(diff(fun, 'y'), 'y').evaluate(evaluate_point)]
    );
}


function plot_contours(fun){
    const steps = 0.02;

    var contour_fun = nerdamer(fun.text())
    for (var i = 0; i < 9; i++) {
        parameters.data.push({
            'fn': contour_fun.text(),
            'skipTip': true,
            'fnType': 'implicit',
            'color': contour_colors[i]
        });
        contour_fun = contour_fun.subtract(steps * 2 ** (i + 1));
    }
}

// PLOT

var method = undefined;

function plot_newton() {

    var start = performance.now();

    // Cleaning
    parameters.data = [];
    document.querySelector("#results").innerHTML = "";
    document.querySelector("#graph").innerHTML = "";
    document.querySelector("#exec-time").innerHTML = "";

    // Getting Elements
    var f = document.querySelector("#function").value.toLowerCase();
    var guess_x = document.querySelector("#guess_x").value;
    var iterations = document.querySelector("#iterations").value;

    // Parsing Function
    f = parse_function(f);
    var fun = nerdamer(f);

    var point = {
        'x': guess_x
    };

    result = newtonRaphson(fun, point, iterations)

    var elapsed_time = 0;
    var end_calulation = performance.now();
    elapsed_time = Number((end_calulation - start).toFixed(0));
    document.querySelector("#exec-time").innerHTML += `<span>Calc. Time: <strong>${elapsed_time}ms</strong> <br></span>`;

    document.querySelector("#results").innerHTML = result.description;
    functionPlot(parameters);

    var end_ploting = performance.now();
    elapsed_time = Number((end_ploting - end_calulation).toFixed(0));
    document.querySelector("#exec-time").innerHTML += `<span>Ploting Time: <strong>${elapsed_time}ms</strong> <br></span>`;
    elapsed_time = Number((end_ploting - start).toFixed(0));
    document.querySelector("#exec-time").innerHTML += `<span>Total Time: <strong>${elapsed_time}ms</strong> <br></span>`;
}


function plot() {

    var start = performance.now();

    clean();

    // Getting Elements
    var f = document.querySelector("#function").value.toLowerCase();
    var guess_x = document.querySelector("#guess_x").value;
    var guess_y = document.querySelector("#guess_y").value;
    var iterations = document.querySelector("#iterations").value;

    // Parsing Function
    f = parse_function(f);
    var fun = nerdamer(f);

    // Plot Function

    plot_contours(fun);

    // Plot Guess Point
    var evaluate_point = {
        'x': guess_x,
        'y': guess_y
    };

    result = method(fun, evaluate_point, iterations)

    var end_calulation = performance.now();
    var elapsed_time = Number((end_calulation - start).toFixed(0));
    document.querySelector("#exec-time").innerHTML += `<span>Calc. Time: <strong>${elapsed_time}ms</strong> <br></span>`;
    document.querySelector("#results").innerHTML = result.description;
    
    functionPlot(parameters);

    var end_ploting = performance.now();
    elapsed_time = Number((end_ploting - end_calulation).toFixed(0));
    document.querySelector("#exec-time").innerHTML += `<span>Ploting Time: <strong>${elapsed_time}ms</strong> <br></span>`;
    
    elapsed_time = Number((end_ploting - start).toFixed(0));
    document.querySelector("#exec-time").innerHTML += `<span>Total Time: <strong>${elapsed_time}ms</strong> <br></span>`;
}


// METHODS

function newtonRaphson(fun, point, iterations){
    var derivative = nerdamer.diff(fun);

    // Plot Function
    parameters.data.push({
        'fn': fun.text(),
        'graphType': 'polyline'
    }); 

    var iteration_description = "";

    for (var i = 0; i < iterations; i++) {
        var iteration_color = colors[i];
        var iteration_alpha = 0.6;

        guess_x = point.x;

        var guess_x_point = [guess_x, 0];

        var function_value = fun.evaluate(point).text();

        var guess_point = [guess_x, function_value];

        var points = [guess_x_point, guess_point];
        parameters.data.push(create_points(points, iteration_color, iteration_alpha));

        var segment = create_segment(points, iteration_color, iteration_alpha);
        parameters.data.push(segment);


        var slope = derivative.evaluate(point).text();
        var tangent = slope + "* (x - " + guess_x + ") + " + function_value;
        parameters.data.push(create_function(tangent, iteration_color, iteration_alpha));

        point.x = nerdamer(nerdamer.solveEquations(tangent + "= 0", 'x').toString()).evaluate().text();
        parameters.data.push(create_points([
            [point.x, 0]
        ], iteration_color, iteration_alpha));

        var x_value = Number(parseFloat(point.x).toFixed(3));
        var y_value = Number(parseFloat(fun.evaluate(point).text()).toFixed(3));

        var iteration_text = `<span class="option--results__iteration" style="color: ${iteration_color}">Iteration ${i + 1}: </span>`;
        iteration_description += `${iteration_text} x=${x_value} f(x)=${y_value} <br>`;
    }

    return {
        "description": iteration_description,
        "values": [x_value, y_value]
    };
}


function newton_method(fun, evaluate_point, iterations){
    
    var x_value;
    var y_value;
    var z_value;
    var iteration_description = "";

    for (var i = 0; i < iterations; i++) {
        var color = colors[i];

        var iteration_alpha = 0.6;

        guess_x = evaluate_point.x;
        guess_y = evaluate_point.y;

        var guess_point = [guess_x, guess_y];

        var hessian = hessian_matrix(fun, evaluate_point);
        var nabla = nabla_vector(fun, evaluate_point);

        var new_point = nerdamer(`[${guess_x}, ${guess_y}] - ${nerdamer.invert(hessian).text()} * ${nabla.text()}`).text();
        evaluate_point.x = nerdamer.matget(new_point, 0, 0).evaluate().text();
        evaluate_point.y = nerdamer.matget(new_point, 1, 0).evaluate().text();

        new_point = [evaluate_point.x, evaluate_point.y];

        var points = [guess_point, new_point];
        parameters.data.push(create_points(points, color, iteration_alpha));

        var segment = create_segment(points, color, iteration_alpha);
        parameters.data.push(segment);

        x_value = Number(parseFloat(evaluate_point.x).toFixed(2));
        y_value = Number(parseFloat(evaluate_point.y).toFixed(2));
        z_value = Number(parseFloat(fun.evaluate(evaluate_point).text()).toFixed(2));
        iteration_description += get_iteration_text(x_value, y_value, z_value, i, color);
    }

    return {
        "description": iteration_description,
        "values": [x_value, y_value, z_value]
    };
}

function newton_method_with_alpha(fun, evaluate_point, alpha, iterations){

    alpha = nerdamer(alpha);

    var x_value;
    var y_value;
    var z_value;
    var iteration_description = "";

    for (var i = 0; i < iterations; i++) {
        var color = colors[i];
        var iteration_alpha = 0.6;

        guess_x = evaluate_point.x;
        guess_y = evaluate_point.y;

        var guess_point = [guess_x, guess_y];

        var hessian = hessian_matrix(fun, evaluate_point);
        var nabla = nabla_vector(fun, evaluate_point);

        var new_point = nerdamer(`[${guess_x}, ${guess_y}] - ([${alpha.text()}, ${alpha.text()}] * ${nerdamer.invert(hessian).text()} * ${nabla.text()})`).text();
        evaluate_point.x = nerdamer.matget(new_point, 0, 0).evaluate().text();
        evaluate_point.y = nerdamer.matget(new_point, 1, 0).evaluate().text();

        new_point = [evaluate_point.x, evaluate_point.y];

        var points = [guess_point, new_point];
        parameters.data.push(create_points(points, color, iteration_alpha));

        var segment = create_segment(points, color, iteration_alpha);
        parameters.data.push(segment);

        x_value = Number(parseFloat(evaluate_point.x).toFixed(2));
        y_value = Number(parseFloat(evaluate_point.y).toFixed(2));
        z_value = Number(parseFloat(fun.evaluate(evaluate_point).text()).toFixed(2));
        iteration_description += get_iteration_text(x_value, y_value, z_value, i, color);
    }

    return {
        "description": iteration_description,
        "values": [x_value, y_value, z_value]
    };
}


function gradient_method(fun, evaluate_point, alpha, iterations){

    alpha = nerdamer(alpha);

    var x_value;
    var y_value;
    var z_value;
    var iteration_description = "";

    for (var i = 0; i < iterations; i++) {
        var color = colors[i];

        var iteration_alpha = 0.6;

        guess_x = evaluate_point.x;
        guess_y = evaluate_point.y;

        var guess_point = [guess_x, guess_y];

        var nabla = nabla_vector(fun, evaluate_point);

        var new_point = nerdamer(`[${guess_x}, ${guess_y}] - ([${alpha.text()}, ${alpha.text()}] * ${nabla.text()})`);
        evaluate_point.x = nerdamer.matget(new_point, 0, 0).evaluate().text();
        evaluate_point.y = nerdamer.matget(new_point, 1, 0).evaluate().text();

        new_point = [evaluate_point.x, evaluate_point.y];

        var points = [guess_point, new_point];
        parameters.data.push(create_points(points, color, iteration_alpha));

        var segment = create_segment(points, color, iteration_alpha);
        parameters.data.push(segment);

        x_value = Number(parseFloat(evaluate_point.x).toFixed(2));
        y_value = Number(parseFloat(evaluate_point.y).toFixed(2));
        z_value = Number(parseFloat(fun.evaluate(evaluate_point).text()).toFixed(2));
        iteration_description += get_iteration_text(x_value, y_value, z_value, i, color);
    }

    return {
        "description": iteration_description,
        "values": [x_value, y_value, z_value]
    };
}


function levenberg_marquardt_method(fun, evaluate_point, beta, iterations){
    beta = nerdamer(beta);

    var x_value;
    var y_value;
    var z_value;
    var iteration_description = "";

    var function_value = parseFloat(fun.evaluate(evaluate_point).text());

    for (var i = 0; i < iterations; i++) {
        var color = colors[i];
        var iteration_alpha = 0.6;

        guess_x = evaluate_point.x;
        guess_y = evaluate_point.y;

        var guess_point = [guess_x, guess_y];

        var hessian = hessian_matrix_levenberg(fun, evaluate_point, beta);
        var nabla = nabla_vector(fun, evaluate_point);

        var new_point = `[${guess_x}, ${guess_y}] - ${nerdamer.invert(hessian).text()} * ${nabla.text()}`;
        new_point = nerdamer(new_point);
        evaluate_point.x = nerdamer.matget(new_point, 0, 0).evaluate().text();
        evaluate_point.y = nerdamer.matget(new_point, 1, 0).evaluate().text();

        new_point = [evaluate_point.x, evaluate_point.y];

        var points = [guess_point, new_point];
        parameters.data.push(create_points(points, color, iteration_alpha));

        var segment = create_segment(points, color, iteration_alpha);
        parameters.data.push(segment);

        var x_value = Number(parseFloat(evaluate_point.x).toFixed(2));
        var y_value = Number(parseFloat(evaluate_point.y).toFixed(2));
        new_function_value = parseFloat(fun.evaluate(evaluate_point).text());
        var z_value = Number(new_function_value.toFixed(2));
        iteration_description += get_iteration_text(x_value, y_value, z_value, i, color);

        if (new_function_value > function_value){
            beta = beta * 2;
        } else {
            beta = beta * 0.5;
        }

        function_value = new_function_value;
    }

    return {
        "description": iteration_description,
        "values": [x_value, y_value, z_value]
    };
}

function hessian_matrix_levenberg(fun, evaluate_point, beta) {
    return nerdamer.matrix(
        [nerdamer(diff(diff(fun, 'x'), 'x').evaluate(evaluate_point) + ' + ' + beta).text(), diff(diff(fun, 'x'), 'y').evaluate(evaluate_point)],
        [diff(diff(fun, 'y'), 'x').evaluate(evaluate_point), nerdamer(diff(diff(fun, 'y'), 'y').evaluate(evaluate_point) + ' + ' + beta).text()]
    );
}



function BFGS(fun, evaluate_point, alpha, iterations){
    var hessian = nerdamer.imatrix(2);
    alpha = nerdamer(alpha);

    var x_value;
    var y_value;
    var z_value;
    var iteration_description = "";

    for (var i = 0; i < iterations; i++) {
        var color = colors[i];
        var iteration_alpha = 0.6;

        guess_x = evaluate_point.x;
        guess_y = evaluate_point.y;

        var guess_point = [guess_x, guess_y];
        var nabla = nabla_vector(fun, evaluate_point);

        var new_point = nerdamer(`[${guess_x}, ${guess_y}] - ([${alpha.text()}, ${alpha.text()}] * ${hessian} * ${nabla})`).text();

        evaluate_point.x = nerdamer.matget(new_point, 0, 0).evaluate().text();
        evaluate_point.y = nerdamer.matget(new_point, 1, 0).evaluate().text();

        new_point = [evaluate_point.x, evaluate_point.y]

        var delta = nerdamer(`matrix(${evaluate_point.x - guess_x}, ${evaluate_point.y - guess_y})`)

        var new_nabla = nabla_vector(fun, evaluate_point);
        var gamma = nerdamer(`${new_nabla} - ${nabla}`)

        var delta_t = nerdamer.transpose(delta)
        var gamma_t = nerdamer.transpose(gamma)

        // Formula extracted from "Numerical Optimization" 2006 - Nocedal, Wright p136
        
        var gammat_t_delta = nerdamer(`matget(${gamma_t} * ${delta}, 0, 0)`)
        var denominator = nerdamer(`matrix([1 / (${gammat_t_delta}), 0], [0, 1 / (${gammat_t_delta})])`)
        var second_try = nerdamer(`imatrix(2) - (${denominator} * ${delta} * ${gamma_t})`)
        var third_try = nerdamer(`imatrix(2) - (${denominator} * ${gamma} * ${delta_t})`)
        var fourth_try = nerdamer(`${denominator} * ${delta} * ${delta_t}`)
        var hessian = nerdamer(`(${second_try}) * ${hessian} * (${third_try}) + (${fourth_try})`)

        // Approximate to avoid floating point errors
        value = nerdamer.matget(hessian, 0, 0).text()
        hessian = nerdamer(`matset(${hessian}, 0, 0, ${value})`)
        value = nerdamer.matget(hessian, 1, 0).text()
        hessian = nerdamer(`matset(${hessian}, 1, 0, ${value})`)
        value = nerdamer.matget(hessian, 0, 1).text()
        hessian = nerdamer(`matset(${hessian}, 0, 1, ${value})`)
        value = nerdamer.matget(hessian, 1, 1).text()
        hessian = nerdamer(`matset(${hessian}, 1, 1, ${value})`)

        var points = [guess_point, new_point];
        parameters.data.push(create_points(points, color, iteration_alpha));

        var segment = create_segment(points, color, iteration_alpha);
        parameters.data.push(segment);

        var x_value = Number(parseFloat(nerdamer(evaluate_point.x).evaluate().text()).toFixed(2));
        var y_value = Number(parseFloat(nerdamer(evaluate_point.y).evaluate().text()).toFixed(2));
        var z_value = Number(parseFloat(fun.evaluate(evaluate_point).text()).toFixed(2));
        iteration_description += get_iteration_text(x_value, y_value, z_value, i, color);
    }

    return {
        "description": iteration_description,
        "values": [x_value, y_value, z_value]
    };

}