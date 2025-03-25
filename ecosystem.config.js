module.exports = {
    apps: [
        {
            name: "w",
            script: "yarn",
            args: "start",
            cwd: "./server",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};