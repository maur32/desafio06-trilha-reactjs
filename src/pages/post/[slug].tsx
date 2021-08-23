import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const postWords = post.data.content.reduce(
    (acc, prev) =>
      acc +
      prev.heading.split(' ').length +
      RichText.asText(prev.body).split(' ').length,
    0
  );

  const timeReading = Math.ceil(postWords / 200);
  return (
    <>
      <Header />
      <main className={styles.container}>
        <img src={post.data.banner.url} alt="Banner" />
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <small>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'd MMM y', {
                locale: ptBR,
              })}
            </time>
            <p>
              <FiUser />
              {post.data.author}
            </p>
            <time>
              <FiClock />
              {timeReading} min
            </time>
          </small>
          {post.data.content.map(content => (
            <div className={styles.postContent} key={content.heading}>
              <h2>{content.heading}</h2>
              <article
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              ></article>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1 }
  );
  const paths = posts.results.map(p => ({ params: { slug: p.uid } }));

  return {
    paths,
    fallback: true,
  };
};
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };
  return {
    props: { post },
  };
};
