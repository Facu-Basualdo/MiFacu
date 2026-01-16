import { Request, Response } from "express";
import { LinksService } from "../services/links.service";
import { asyncHandler } from "../middleware/errorHandler.middleware";

export class LinksController {
    private linksService: LinksService;

    constructor() {
        this.linksService = new LinksService();
    }

    getLinks = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const links = await this.linksService.getAllLinks(userId);
        res.status(200).json({
            status: 'success',
            data: links,
        });
    });

    createLink = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const link = await this.linksService.createLink(req.body, userId);
        res.status(201).json({
            status: 'success',
            data: link,
        });
    });

    updateLink = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;
        const link = await this.linksService.updateLink(parseInt(id), req.body, userId);
        res.status(200).json({
            status: 'success',
            data: link,
        });
    });

    deleteLink = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = req.user.id;
        await this.linksService.deleteLink(parseInt(id), userId);
        res.status(204).send();
    });
}

export const linksController = new LinksController();
