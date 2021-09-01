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
import Link from 'next/link';
import PreviewButton from '../../components/PreviewButton';
import { Document } from '@prismicio/client/types/documents';
import { useUtterances } from '../../hooks/useUterance';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  previousPost: {
    title: any;
    uid: string;
  };
  nextPost: {
    title: any;
    uid: string;
  };
}

export default function Post({
  post,
  preview,
  previousPost,
  nextPost,
}: PostProps) {
  const router = useRouter();
  const commentNodeId = 'comments';
  useUtterances(commentNodeId);

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

  const isEdited = post.first_publication_date !== post.last_publication_date;

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
          {isEdited && (
            <p className={styles.edit}>
              * editado em{' '}
              {format(new Date(post.last_publication_date), 'd MMM y', {
                locale: ptBR,
              })}
              , às{' '}
              {format(new Date(post.last_publication_date), 'HH:mm', {
                locale: ptBR,
              })}
            </p>
          )}
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
          {preview && <PreviewButton>Sair do modo Preview</PreviewButton>}
          <hr />
          <footer>
            <div>
              {previousPost.title ? <p>{previousPost.title}</p> : <p></p>}
              {nextPost.title ? <p>{nextPost.title}</p> : <p></p>}
            </div>
            <div>
              {previousPost.uid ? (
                <Link href={`${previousPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              ) : (
                <a></a>
              )}
              {nextPost.uid ? (
                <Link href={`${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              ) : (
                <a></a>
              )}
            </div>
            <div id={commentNodeId} />
          </footer>
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
export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  // const response = await prismic.getByUID('posts', String(slug), {
  //   ref: previewData?.ref ?? null,
  //   pageSize: 1,
  // });

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      ref: previewData?.ref ?? null,
    }
  );

  const response = postsResponse.results.find(p => p.uid === slug);

  const previousPost = {
    title:
      postsResponse.results[
        postsResponse.results.findIndex(p => p.uid === slug) - 1
      ]?.data.title ?? null,
    uid:
      postsResponse.results[
        postsResponse.results.findIndex(p => p.uid === slug) - 1
      ]?.uid ?? null,
  };
  const nextPost = {
    title:
      postsResponse.results[
        postsResponse?.results.findIndex(p => p.uid === slug) + 1
      ]?.data.title ?? null,
    uid:
      postsResponse.results[
        postsResponse?.results.findIndex(p => p.uid === slug) + 1
      ]?.uid ?? null,
  };

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
    props: { post, preview, previousPost, nextPost },
  };
};
