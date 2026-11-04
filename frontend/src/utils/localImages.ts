import instImg1 from '../assets/h1.jpg';
import instImg2 from '../assets/h2.jpg';
import pkgImg1 from '../assets/p1.jpg';
import pkgImg2 from '../assets/p2.jpg';
import pkgImg3 from '../assets/p3.jpg';

/**
 * 本地配图（写死方案）
 *
 * 服务器上数据库里的 base64 图片加载异常，暂时全部使用本地图片，
 * 不读 institutions.logo / packages.cover_image。
 * 以后要恢复"数据库有图优先"，把各页面 src 换成 inst.logo / pkg.cover_image 即可。
 */
export const INSTITUTION_IMAGES = [instImg1, instImg2];
export const PACKAGE_IMAGES = [pkgImg1, pkgImg2, pkgImg3];

/** 按序号取机构配图，2 张循环 */
export function institutionImage(index = 0): string {
  return INSTITUTION_IMAGES[Math.abs(index) % INSTITUTION_IMAGES.length];
}

/** 按序号取套餐配图，3 张循环 */
export function packageImage(index = 0): string {
  return PACKAGE_IMAGES[Math.abs(index) % PACKAGE_IMAGES.length];
}
