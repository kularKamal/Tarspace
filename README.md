# Iotinga Space

This repo contains code for the Iotinga Space webapp, a frontend for the internal project delivery system. The app is reachable at [space.tinga.io](https://space.tinga.io)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and use [craco](https://craco.js.org/).

## Deployment
Use the Iotinga CLI, you known how. The CI system will take care of the rest.

This project is deployed on S3 as a static website on stage `production`. These are some useful links:
- [S3 bucket](https://s3.console.aws.amazon.com/s3/buckets/space-tinga-io?region=eu-west-1&tab=objects) (console)
- [Cloudfront distribution](https://us-east-1.console.aws.amazon.com/cloudfront/v4/home?region=eu-west-1#/distributions/E2I1IK45FNT6XF) (console)

> [!NOTE]
> Cloudfront retains a cache of the webpage for quite a long time, it may be required to create a cache invalidation manually to see deployment results immediately.

## Development

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

