import path from "path";
import express from "express";
import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { config as serverConfig } from "./config";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom";

export default config({
    getId: () => "Your Colyseus App",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);

    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        const publicPath = path.resolve("../client/dist");
        app.use(express.static(publicPath));

        app.get("/play", (req, res) => {
            const indexPath = path.join(publicPath, "index.html");
            res.sendFile(indexPath);
        });

        app.get("/config", (req, res) => {
        	res.json(serverConfig);
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
