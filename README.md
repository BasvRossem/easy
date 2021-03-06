 # easy
 The easiest framework to build robust and stable microservices in TypeScript on node.js.

<a href="https://www.npmjs.com/package/@thisisagile/easy" target="_blank"><img src="https://img.shields.io/npm/v/@thisisagile/easy.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@thisisagile/easy" target="_blank"><img src="https://img.shields.io/npm/dm/@thisisagile/easy.svg" alt="npm downloads" /></a>
<a href="https://github.com/thisisagile/easy/actions?query=workflow%3A%22pipeline%22"><img src="https://github.com/thisisagile/easy/workflows/pipeline/badge.svg?branch=main" alt="pipeline status" /></a>
<a href="https://sonarcloud.io/dashboard?id=thisisagile_easy" target="_blank"><img src="https://sonarcloud.io/api/project_badges/measure?project=thisisagile_easy&metric=alert_status" alt="quality gate" /></a>
<a href="https://github.com/semantic-release/semantic-release" target="_blank"><img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release" /></a>

# Description
Straightforward, smart library for building domain-driven microservice architectures, implementing a simple evolutionary architecture. This library is distilled from projects where the teams I've worked with built platforms based on a simple, common architecture where each service centers around a small part of the platform domain.

This framework will include best and foremost simple practices to support building microservices, based on the following software architecture and patterns:

# Architecture
Microservices built with **easy** have a four layered architecture: services, process, domain, data. Each of the layers serves a single purpose and follows clear patterns and communications:

- *Services*. This layer contains resource classes, which handle requests to the microservice's endpoints.
- *Process*. This second layer contains use cases, which handle all process logic of the microservice.
- *Domain*. At the heart of each microservice lies its domain, which consists of entities, values objects, enumerations and structs. To approach the objects in the domain, this layer also contains repositories. 
- *Data*. The bottom layer of each microservice contains gateways, that allow the microservice to interact with its outside world, such as relational databases, no-sql databases, file storage or other services.

The **easy** framework supports this architecture by supplying root classes (or layer supertypes) for each of the types describe above. The repository `easy-test` contains utilities to assist you with testing **easy** specific constructs, such as `toMatchText` or `toMatchPath` for checking paths in uri's. The repository `easy-sample` contains examples of microservices built with the **easy** framework.

# Root
At the root of each microservice built using eas, there is a class that inherits from `Service`. These are used to initiate the service, set the `port` at which it runs,  register all resource classes, and start the service. An example services class is the one below for a movie service.

    SampleService.Movie
      .with(MoviesResource, MovieResource)
      .atPort(9001)
      .start();

This movie service registers two resources, `MoviesResource` and `MovieResource`, each of which handle endpoints. The service listens at port `9001`.

In general, you will not build a single microservices, but rather a collection of microservices, each responsible for a distinct part of the complete business domain. In that case, it can be useful to build a root class for your services, such as the `SampleService` class below. 

    class SampleService extends Service {
      static readonly Movie = new SampleService('movie');
      pre = () => [correlation];
      post = () => [error, notFound];
    }

The `SampleService` inherits directly from the `Service` layer supertype from **easy**. The methods `pre()` and `post()` can be used to register middleware (by default **easy** uses express as its web server. However, this can easily be changed if you require so. The middlewares `correlation`, `error` and `notFound` are also provided by **easy**.  

# Services
The services layer has resource as the layer supertype, to model the API exposed.

# Process
The process layer contains use cases, that model your process.

# Domain
In the domain layer there are supertypes to model the domain, such as entities, records, value objects and enumerations.
The domain layer also knows the repository layer supertype, for handling instances of entities and structs.

## Entities
Using **easy**, your entities, as described in domain driven design, inherit from the `Entity` class. This gives your entities identity. The default implementation of `Entity` provides a generated `id` property (it's a UUID by default). 

All classes that inherit from `Record`  or `Entity` will have an internal object called `state`. Normally, the state of an object is passed to it during construction. Using this internal object `state` allows for easy mapping of the content of an entity, which is usually JSON, to its properties. We prefer to keep our entities immutable. Properties therefore can be readonly. An update to an object is considered a state change and should therefore always return a new instance of the entity, instead of modifying the state of the current instance.

An example of an entity is the `Movie` class below. Here the content of the object comes from an external service (called Omdb), and is mapped to the actual properties of the `Movie` class.

    export class Movie extends Entity {
        @required() readonly id: Id = this.state.imdbID;
        @required() readonly title: string = this.state.Title;
        @required() readonly year: number = this.state.Year;
        readonly poster: string = this.state.Poster;
        
        update = (add?: Json): Movie => new Movie(this.toJSON(add));
    }

Some of the properties of `Movie` have decorators, such as `@required`. These decorators can be used to validate the object, using the separate `validate()` function. 

## Enumerables
Most modern programming languages support the use of enumerables. The goal of an enumerable is to allow only a limited set of values to be chosen for a particular property or passed as a parameter of a function, or its return type. Although this seems trivial, there are some drawbacks to using enumerables. 

First of all, in most language, you can not inherit from enumerables. As a result, if you define an enumerable in a library, and would like to add values to it in another repository, this is not possible. If you would, as we do in **easy** support a list of scopes, we could have created an enumerable `Scope`, with the scopes we see. However, if you use **easy** and would like to add your own scopes, this is not possible with a default enumerable.

Secondly, in most language (Java not included), enumerations only have two properties, the name and the index of its items. Of you would want to have some more properties on you enumerations, or add some behavior, an enumerable is not your best bet.

And thridly, and perhaps the most dangerous one, if you persist your enumerables to a storage facility (a database for instance), enumerations are usually stored using their index. This makes the data hard to interpret. After all, what does scope `2` really mean? But even worse, if you would add more items to your enumerable later on, the index of the items might alter, and hence the stored data gets a different meaning, often without noticing.

Therefore, **easy** provides an `Enum` class, which is both extendable and allows you to define meaningful identifiers for your items, and also add additional properties. And still, the behaviour of enumerables created using the `Enum` class, is still comparable to traditional enumerables. Here's the `UseCase` enumerable from **easy** as an example.

    export class UseCase extends Enum {
      constructor(readonly scope: Scope, name: string, id: string = stringify(name).kebab) {
        super(name, id);
      }

      static readonly Main = new UseCase(Scope.Basic, "Main");
      static readonly Login = new UseCase(Scope.Auth, "Login");
      static readonly Logout = new UseCase(Scope.Auth, "Logout");
      static readonly ForgotPassword = new UseCase(Scope.Auth, "Forgot password");
      static readonly ChangePassword = new UseCase(Scope.Auth, "Change password");
    }

The class `UseCase` has five items, such as `UseCase.Main` or `UseCase.ChangePassword`. The constructor has an additional property `scope`, which the `Enum` class does not have, but it calls on the constructor of its superclass to actal make it work. All instance of enumerables have a property `id`, which is used to store the enums, when used as property on entities, or for comparison.

# Validation
All **easy** microservices evolve around their part of the total business domain you are implementing. Quite usually, in it's domain layer, a microservice contains an *aggregate*. In domain-driven design an aggregate maps to a part of the domain that is persisted together. In a relational database, this is usually guarded with a transaction. In a document database, such as MongoDB, this is more often a single serialized `Json` object.

To assure that such an aggregate is valid, when persisted, it is validated, usually starting from the *aggregate root*. In most cases, the aggregate root is the entity that is also the resource that requests are about, and in most often it is also the name of the microservice itself.

The **easy** framework supplies a nice and easy mechanism for validating instances of the microservice's aggregate. We supply to easy-to-use functions, named `validate(subject?: unknown): Results` and `validateReject = <T>(subject?: T): Promise<T>`. Although you can pass any object to these functions, in general, you will pass the aggregate root as an argument.

    validate = (dev: Developer): Results => validate(dev);

The `validate()` function will validate its `subject`, and recursively the subjects properties. The outcome of this validation is always a `Results` object, with a list of shortcomings (in its `results` property) of the subject. The `Results` object also has a property `isValid`, which is set to `true` if the subject is valid, or to `false` when it is not.

# Data
It is the responsibility of the classes in the data layer to fetch and deliver data from outside the microservices. This data can come from e.g. a file system, relational and other types of databases (we prefer document databases), or from other services on your domain, or from services outside your domain. Classes performing this function are called gateways. 

# Utilities
Additionally, this library contains utility classes for standardizing e.g. uri's, and ids, constructors, lists, queries, and errors. Quite often these are constructed as monads, which renders robust code.

This library will contain a simple validation mechanism, using decorators.

We keep this library simple on purpose, extending it using additional libraries and frameworks should be possible simply by embedding their API's.

Likely we will use jest for unit testing, wrap axios for request handling, and a simple mongodb connector, and wrap tsyringe for dependency injection.

Please note: we are slowly adding more value to the library, step by step. Most of our additions are useful as such, both it will take some effort for the full architecture to be in place to implement fully working microservices. Please bare with us.

## When
The `When` class is a utility that is usually exposed through the `when()` function. It can be used to make validations in promises a little easier. such as in the following example.

    update = (json: Json): Promise<T> =>
    this.gateway
    .byId(json.id as Id)
    .then(j => when(j).not.isDefined.reject(Exception.DoesNotExist))
    .then(j => new this.ctor(j).update(json))
    .then(i => when(i).not.isValid.reject())
    .then(i => this.gateway.update(toJson(i)))
    .then(j => new this.ctor(j));

The `reject()` method is used to reject the chain, so it will not execute any of its following statements. The `reject()` method accept any error type. A special case is made for `when().not.isValid`. This statement validates the subject of the `when`, and reject with the results (an instance of `Results`) if no parameter is passed to `reject()`.