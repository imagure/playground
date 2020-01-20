
const fetchFromString = function(o, s) {
  const a = s.split('.');
  let return_obj = {...o};
  for (let i = 0, n = a.length; i < n; ++i) {
    let k = a[i];
    if (k in return_obj) {
        return_obj = return_obj[k];
    } else {
        throw new Error("Inexistant object entry");;
    }
  }
  return return_obj;
}

const setFromString = function(obj, path, value) {
    let prop = path;
    if (typeof path==='string') {
      prop = path.split(".");
    };
    if (prop.length > 1) {
        var e = prop.shift();
        setFromString(obj[e] =
                 Object.prototype.toString.call(obj[e]) === "[object Object]"
                 ? obj[e]
                 : {},
               prop,
               value);
    } else {
        obj[prop[0]] = value;
    }
    return obj;
}

class Node {

  static validate(spec) {
    return true;
  }

  constructor(node_spec = {}) {
    this._spec = node_spec;
  }

  get id() {
    return this._spec["id"];
  }

  next(result) {
    return this._spec["next"];
  }

  validate() {
    return true;
  }

  async run(input_bag = {}, input = {}, external_input = {}) {
    try {
      const execution_data = this._preProcessing(input_bag, input, external_input);
      const [result, status] = await this._run(
        execution_data,
        external_input
      );
      const output_bag = this._postProcessing(input_bag, result);
      return {
        node_id: this.id,
        bag: output_bag,
        external_input: external_input,
        result: result,
        error: null,
        status: status,
        next_node_id: this.next(result)
      };
    } catch (err) {
      return {
        node_id: this.id,
        bag: input_bag,
        external_input: external_input,
        result: null,
        error: err,
        status: "error",
        next_node_id: this.id
      };
    }
  }

  _preProcessing(input_bag, input, external_input) {
    const input_params = this._spec.parameters.input;
    let execution_data = {};
    let actual_path;
    for (let param of input_params) {
      const namespace = param.namespace;
      const keys = param.keys;
      for (let path of keys) {
        let entry;
        if (namespace==="bag") {
          entry = fetchFromString(input_bag, path);
        } else if(namespace==="external_input") {
          entry = fetchFromString(external_input, path);
        } else if(namespace==="result") {
          entry = fetchFromString(input, path);
        }
        execution_data = { ...execution_data,
                           ...setFromString(execution_data, path, entry) };
      }
    }
    return execution_data;
  }

  _postProcessing(input_bag, result) {
    return input_bag;
  }

  // MUST RETURN [bag, result, status]
  _run(bag, input, external_input) {
    throw Error(
      "Subclass and implement returning [bag: {}, result: {}, status: ProcessStatus]"
    );
  }
}

class TestNode extends Node {
  _run(bag, input, external_input) {
    const result = {profile: "test profile"};
    return [result, "running"];
  }
}

const node_spec = {
  name: "TestNode",
  type: "TestNode",
  id: "2",
  next: "3",
  parameters: {
    input: [{
      namespace: "bag",
      keys: ["bag_info.user"]
    },
    {
      namespace: "result",
      keys: ["input_from_result"]
    }],
    output: [
      {
        key: "profile"
      }
    ]
  }
};

const main = async () => {
  const node = new TestNode(node_spec);
  const results = await node.run(
    {bag_info: {user: {obj: "user"}, profile: "profile"}},
    {input_from_result: "result here"},
    {user_data: "external_input here"}
  );

  console.log("State result: ", results);
};

main();
