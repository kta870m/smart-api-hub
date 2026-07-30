import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import { db } from "../config/data-source";
import jwt from "jsonwebtoken";

export class AuthController {
    async register(req: Request,res: Response){
        try{
            const {email, password, role} = req.body;
            if(!email || !password){
                return res.status(400).json({error: 'Email và password không được để trống'});
            }

            const existingUser = await db('users').where({email}).first();
            if(existingUser){
                return res.status(404).json({ email: 'Email này đã được sử dụng' });
            }

            //Ma hoa mat khau
            const hashedPassword = await bcrypt.hash(password, 10);
            const userRole = role === 'admin' ? 'admin' : 'user';

            const [newUser] = await db('users')
            .insert({
                email,
                password: hashedPassword,
                role: userRole
            })
            .returning(['id','email','role','created_at','updated_at']);

            return res.status(201)
            .json({
                message: 'Đăng ký tài khoản thành công',
                user: newUser
            });
        }catch(error: any){
            return res.status(500).json({error: error.message || 'Server Error'});
        }
    }

    async login(req: Request, res: Response){
        try{
            const {email, password} = req.body;

            if(!email || !password){
                return res.status(400).json({error: 'Email và password không được để trống'});
            }

            const user = await db('users').where({email}).first();
            if(!user){
                return res.status(401).json({error: 'Email hoặc mật khẩu không chính xác'});
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(!isPasswordValid){
                return res.status(401).json({error: 'Email hoặc mật khẩu không chính xác'});
            }

            // Init JWT
            const secret = process.env.JWT_SECRET || 'secret';
            const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

            const token = jwt.sign(
                {id: user.id, email: user.email, role: user.role},
                secret,
                {expiresIn: expiresIn as any}
            );

            return res.status(200).json({
                message: 'Đăng nhập thành công',
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });
        }catch(error: any){
            return res.status(500).json({error: error.message || 'Server error'});
        }
    }
}

export const authController = new AuthController();