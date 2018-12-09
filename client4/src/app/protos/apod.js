/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
(function (global, factory) { /* global define, require, module */

  /* AMD */
  if (typeof define === 'function' && define.amd)
    define(["protobufjs/minimal"], factory);

  /* CommonJS */ else if (typeof require === 'function' && typeof module === 'object' && module && module.exports)
    module.exports = factory(require("protobufjs/minimal"));

})(this, function ($protobuf) {
  "use strict";

  // Common aliases
  var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

  // Exported root namespace
  var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

  $root.Apod = (function () {

    /**
     * Properties of an Apod.
     * @exports IApod
     * @interface IApod
     * @property {string|null} [date] Apod date
     * @property {string|null} [explanation] Apod explanation
     * @property {string|null} [title] Apod title
     * @property {string|null} [credit] Apod credit
     */

    /**
     * Constructs a new Apod.
     * @exports Apod
     * @classdesc Represents an Apod.
     * @implements IApod
     * @constructor
     * @param {IApod=} [properties] Properties to set
     */
    function Apod(properties) {
      if (properties)
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
    }

    /**
     * Apod date.
     * @member {string} date
     * @memberof Apod
     * @instance
     */
    Apod.prototype.date = "";

    /**
     * Apod explanation.
     * @member {string} explanation
     * @memberof Apod
     * @instance
     */
    Apod.prototype.explanation = "";

    /**
     * Apod title.
     * @member {string} title
     * @memberof Apod
     * @instance
     */
    Apod.prototype.title = "";

    /**
     * Apod credit.
     * @member {string} credit
     * @memberof Apod
     * @instance
     */
    Apod.prototype.credit = "";

    /**
     * Creates a new Apod instance using the specified properties.
     * @function create
     * @memberof Apod
     * @static
     * @param {IApod=} [properties] Properties to set
     * @returns {Apod} Apod instance
     */
    Apod.create = function create(properties) {
      return new Apod(properties);
    };

    /**
     * Encodes the specified Apod message. Does not implicitly {@link Apod.verify|verify} messages.
     * @function encode
     * @memberof Apod
     * @static
     * @param {IApod} message Apod message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Apod.encode = function encode(message, writer) {
      if (!writer)
        writer = $Writer.create();
      if (message.date != null && message.hasOwnProperty("date"))
        writer.uint32(/* id 1, wireType 2 =*/10).string(message.date);
      if (message.explanation != null && message.hasOwnProperty("explanation"))
        writer.uint32(/* id 2, wireType 2 =*/18).string(message.explanation);
      if (message.title != null && message.hasOwnProperty("title"))
        writer.uint32(/* id 3, wireType 2 =*/26).string(message.title);
      if (message.credit != null && message.hasOwnProperty("credit"))
        writer.uint32(/* id 4, wireType 2 =*/34).string(message.credit);
      return writer;
    };

    /**
     * Encodes the specified Apod message, length delimited. Does not implicitly {@link Apod.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Apod
     * @static
     * @param {IApod} message Apod message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Apod.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an Apod message from the specified reader or buffer.
     * @function decode
     * @memberof Apod
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Apod} Apod
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Apod.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader))
        reader = $Reader.create(reader);
      var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Apod();
      while (reader.pos < end) {
        var tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            message.date = reader.string();
            break;
          case 2:
            message.explanation = reader.string();
            break;
          case 3:
            message.title = reader.string();
            break;
          case 4:
            message.credit = reader.string();
            break;
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an Apod message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Apod
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Apod} Apod
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Apod.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader))
        reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an Apod message.
     * @function verify
     * @memberof Apod
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Apod.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.date != null && message.hasOwnProperty("date"))
        if (!$util.isString(message.date))
          return "date: string expected";
      if (message.explanation != null && message.hasOwnProperty("explanation"))
        if (!$util.isString(message.explanation))
          return "explanation: string expected";
      if (message.title != null && message.hasOwnProperty("title"))
        if (!$util.isString(message.title))
          return "title: string expected";
      if (message.credit != null && message.hasOwnProperty("credit"))
        if (!$util.isString(message.credit))
          return "credit: string expected";
      return null;
    };

    /**
     * Creates an Apod message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Apod
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Apod} Apod
     */
    Apod.fromObject = function fromObject(object) {
      if (object instanceof $root.Apod)
        return object;
      var message = new $root.Apod();
      if (object.date != null)
        message.date = String(object.date);
      if (object.explanation != null)
        message.explanation = String(object.explanation);
      if (object.title != null)
        message.title = String(object.title);
      if (object.credit != null)
        message.credit = String(object.credit);
      return message;
    };

    /**
     * Creates a plain object from an Apod message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Apod
     * @static
     * @param {Apod} message Apod
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Apod.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.defaults) {
        object.date = "";
        object.explanation = "";
        object.title = "";
        object.credit = "";
      }
      if (message.date != null && message.hasOwnProperty("date"))
        object.date = message.date;
      if (message.explanation != null && message.hasOwnProperty("explanation"))
        object.explanation = message.explanation;
      if (message.title != null && message.hasOwnProperty("title"))
        object.title = message.title;
      if (message.credit != null && message.hasOwnProperty("credit"))
        object.credit = message.credit;
      return object;
    };

    /**
     * Converts this Apod to JSON.
     * @function toJSON
     * @memberof Apod
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Apod.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Apod;
  })();

  $root.Apods = (function () {

    /**
     * Properties of an Apods.
     * @exports IApods
     * @interface IApods
     * @property {Array.<IApod>|null} [apods] Apods apods
     */

    /**
     * Constructs a new Apods.
     * @exports Apods
     * @classdesc Represents an Apods.
     * @implements IApods
     * @constructor
     * @param {IApods=} [properties] Properties to set
     */
    function Apods(properties) {
      this.apods = [];
      if (properties)
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
    }

    /**
     * Apods apods.
     * @member {Array.<IApod>} apods
     * @memberof Apods
     * @instance
     */
    Apods.prototype.apods = $util.emptyArray;

    /**
     * Creates a new Apods instance using the specified properties.
     * @function create
     * @memberof Apods
     * @static
     * @param {IApods=} [properties] Properties to set
     * @returns {Apods} Apods instance
     */
    Apods.create = function create(properties) {
      return new Apods(properties);
    };

    /**
     * Encodes the specified Apods message. Does not implicitly {@link Apods.verify|verify} messages.
     * @function encode
     * @memberof Apods
     * @static
     * @param {IApods} message Apods message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Apods.encode = function encode(message, writer) {
      if (!writer)
        writer = $Writer.create();
      if (message.apods != null && message.apods.length)
        for (var i = 0; i < message.apods.length; ++i)
          $root.Apod.encode(message.apods[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
      return writer;
    };

    /**
     * Encodes the specified Apods message, length delimited. Does not implicitly {@link Apods.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Apods
     * @static
     * @param {IApods} message Apods message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Apods.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an Apods message from the specified reader or buffer.
     * @function decode
     * @memberof Apods
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Apods} Apods
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Apods.decode = function decode(reader, length) {
      if (!(reader instanceof $Reader))
        reader = $Reader.create(reader);
      var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Apods();
      while (reader.pos < end) {
        var tag = reader.uint32();
        switch (tag >>> 3) {
          case 1:
            if (!(message.apods && message.apods.length))
              message.apods = [];
            message.apods.push($root.Apod.decode(reader, reader.uint32()));
            break;
          default:
            reader.skipType(tag & 7);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an Apods message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Apods
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Apods} Apods
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Apods.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader))
        reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an Apods message.
     * @function verify
     * @memberof Apods
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Apods.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.apods != null && message.hasOwnProperty("apods")) {
        if (!Array.isArray(message.apods))
          return "apods: array expected";
        for (var i = 0; i < message.apods.length; ++i) {
          var error = $root.Apod.verify(message.apods[i]);
          if (error)
            return "apods." + error;
        }
      }
      return null;
    };

    /**
     * Creates an Apods message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Apods
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Apods} Apods
     */
    Apods.fromObject = function fromObject(object) {
      if (object instanceof $root.Apods)
        return object;
      var message = new $root.Apods();
      if (object.apods) {
        if (!Array.isArray(object.apods))
          throw TypeError(".Apods.apods: array expected");
        message.apods = [];
        for (var i = 0; i < object.apods.length; ++i) {
          if (typeof object.apods[i] !== "object")
            throw TypeError(".Apods.apods: object expected");
          message.apods[i] = $root.Apod.fromObject(object.apods[i]);
        }
      }
      return message;
    };

    /**
     * Creates a plain object from an Apods message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Apods
     * @static
     * @param {Apods} message Apods
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Apods.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults)
        object.apods = [];
      if (message.apods && message.apods.length) {
        object.apods = [];
        for (var j = 0; j < message.apods.length; ++j)
          object.apods[j] = $root.Apod.toObject(message.apods[j], options);
      }
      return object;
    };

    /**
     * Converts this Apods to JSON.
     * @function toJSON
     * @memberof Apods
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Apods.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Apods;
  })();

  return $root;
});
